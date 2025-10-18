'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { User } from '@/components/auth-provider';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['branch_admin', 'teacher', 'parent']),
  branchId: z.string().min(1, { message: 'Branch is required.' }),
});

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: User | null;
}

interface Branch {
  id: string;
  name: string;
}

const BRANCH_NAMES = ["Ogbomosho", "Saminaka", "Keffi", "Jos"];

// This function now returns a promise that resolves when seeding is done.
async function seedBranchesIfNeeded() {
  const branchesCollectionRef = collection(db, 'branches');
  try {
      const existingBranchesSnap = await getDocs(branchesCollectionRef);

      if (existingBranchesSnap.empty) {
        console.log("No branches found, seeding initial branches...");
        const batch = writeBatch(db);
        BRANCH_NAMES.forEach(name => {
          const slug = name.toLowerCase().replace(/\s+/g, '-');
          const branchRef = doc(branchesCollectionRef, slug);
          batch.set(branchRef, { name, slug, address: name }); // Using name as address placeholder
        });
        await batch.commit();
        console.log("Initial branches have been seeded.");
      }
  } catch (error) {
    console.error("Error seeding branches:", error);
  }
}

export function InviteUserDialog({ isOpen, onOpenChange, currentUser }: InviteUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  // State to trigger re-fetch for useCollection
  const [dataVersion, setDataVersion] = useState(0);

  const branchesQuery = useMemoFirebase(() => {
    // Dependency on dataVersion will force useCollection to refetch
    if (dataVersion >= 0) {
      return collection(db, 'branches');
    }
    return null;
  }, [dataVersion]);
  
  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);

  // Effect to seed branches when the dialog is opened by a super admin.
  useEffect(() => {
    if (isOpen && currentUser?.role === 'super_admin' && !isSeeding) {
      setIsSeeding(true);
      seedBranchesIfNeeded().then(() => {
        // After seeding (or confirming they exist), trigger a data refetch.
        setDataVersion(v => v + 1);
        setIsSeeding(false);
      });
    }
  }, [isOpen, currentUser, isSeeding]);


  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'super_admin') {
      return ['branch_admin', 'teacher', 'parent'];
    }
    if (currentUser?.role === 'branch_admin') {
      return ['teacher', 'parent'];
    }
    return [];
  }, [currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'branch_admin',
      branchId: '',
    },
  });
  
  // Reset form when dialog opens or user changes
  useEffect(() => {
    if(isOpen) {
      form.reset({
        fullName: '',
        email: '',
        password: '',
        role: currentUser?.role === 'branch_admin' ? 'teacher' : 'branch_admin',
        branchId: currentUser?.role === 'branch_admin' ? currentUser.branchId : '',
      });
    }
  }, [isOpen, currentUser, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Temporarily sign out the current admin to not conflict with new user creation
      const currentAdminEmail = auth.currentUser?.email;
      if (currentAdminEmail) {
         await auth.signOut();
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        branchId: values.branchId,
      });

      // The new user is now signed in, so sign them out immediately.
      await auth.signOut();
      
      toast({
        title: 'User Created Successfully',
        description: `${values.fullName} has been added. You will be logged out to complete the process. Please log back in.`,
      });
      
      onOpenChange(false);
      
      // Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);

    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Failed to Create User',
        description: errorMessage,
      });
       // If creating the user fails, attempt to log the admin back in.
       // This is a best-effort attempt and may require a manual login.
      if (auth.currentUser === null) {
          console.warn("User creation failed. Please log in again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Enter the details of the new user. They will be created in the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role} className="capitalize">
                          {role.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={currentUser?.role === 'branch_admin' || branchesLoading || isSeeding}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branchesLoading || isSeeding ? (
                        <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                      ) : (
                        branches?.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isSeeding}>
                {(isLoading || isSeeding) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invite User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
