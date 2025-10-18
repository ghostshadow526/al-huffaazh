
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase, useAuth as useFirebaseAuth, useFirestore } from '@/firebase/provider';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['branch_admin', 'teacher', 'parent']),
  branchId: z.string().optional(),
}).refine((data) => {
    // branchId is required if role is not super_admin
    return data.role === 'super_admin' || (typeof data.branchId === 'string' && data.branchId.length > 0);
}, {
    message: 'Branch is required for this role.',
    path: ['branchId'],
});


interface Branch {
  id: string;
  name: string;
}

const BRANCH_NAMES = [
    "JOS – Dutse Uku Branch",
    "Naraguta Branch",
    "Saminaka Branch",
    "Lere Branch",
    "Dokan Lere Branch",
    "Mariri Branch",
    "Katchia Branch",
    "Kayarda Branch",
    "Toro Branch",
    "Marwa Branch",
    "Nye Kogi State Branch",
    "Gambare Ogbomosho Branch",
    "Hamama Ogbomosho Branch",
    "Sakee Branch"
];


export default function InviteUserPage() {
  const { user: currentUser } = useAuth();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  async function seedBranchesIfNeeded() {
    if (!db) return false;
    const branchesCollectionRef = collection(db, 'branches');
    try {
        const existingBranchesSnap = await getDocs(branchesCollectionRef);
  
        if (existingBranchesSnap.empty) {
          console.log("No branches found, seeding initial branches...");
          const batch = writeBatch(db);
          BRANCH_NAMES.forEach(name => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const branchRef = doc(branchesCollectionRef, slug);
            batch.set(branchRef, { name: name, slug, address: name.replace(' Branch', '') });
          });
          await batch.commit();
          console.log("Initial branches have been seeded.");
          return true;
        }
    } catch (error) {
      console.error("Error seeding branches:", error);
    }
    return false;
  }

  const branchesQuery = useMemoFirebase(() => {
    if (dataVersion >= 0 && db) {
      return collection(db, 'branches');
    }
    return null;
  }, [dataVersion, db]);
  
  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      setIsSeeding(true);
      seedBranchesIfNeeded().then((seeded) => {
        if (seeded) {
          setDataVersion(v => v + 1);
        }
        setIsSeeding(false);
      });
    } else {
        setIsSeeding(false);
    }
  }, [currentUser, db]);


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
  
  const selectedRole = useWatch({
    control: form.control,
    name: 'role'
  });

  useEffect(() => {
      form.reset({
        fullName: '',
        email: '',
        password: '',
        role: currentUser?.role === 'branch_admin' ? 'teacher' : 'branch_admin',
        branchId: currentUser?.role === 'branch_admin' ? currentUser.branchId : '',
      });
  }, [currentUser, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !db) return;
    setIsLoading(true);
    try {
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

      await auth.signOut();
      
      toast({
        title: 'User Created Successfully',
        description: `${values.fullName} has been added. You will be logged out to complete the process. Please log back in.`,
      });
      
      setTimeout(() => {
        router.push('/login');
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
      if (auth.currentUser === null) {
          console.warn("User creation failed. Please log in again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Invite New User</CardTitle>
        <CardDescription>
          Enter the details of the new user. They will be created in the system.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                   <Select onValueChange={(value) => {
                       field.onChange(value);
                        if (currentUser?.role === 'branch_admin') {
                           form.setValue('branchId', currentUser.branchId);
                       }
                   }} defaultValue={field.value}>
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
                    value={field.value}
                    disabled={currentUser?.role === 'branch_admin' || branchesLoading || isSeeding}
                    required={selectedRole !== 'super_admin'}
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
                          <SelectItem key={branch.id} value={branch.id} className="capitalize">
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isSeeding}>
                {(isLoading || isSeeding) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invite User
              </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    