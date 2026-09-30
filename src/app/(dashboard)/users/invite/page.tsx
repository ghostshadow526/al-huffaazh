

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase, useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { seedBranchesIfNeeded } from "@/lib/seedBranches";
import { SCHOOL_CLASSES, CLASS_CATEGORIES } from "@/lib/constants/classes";


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
  role: z.enum(['branch_admin', 'teacher', 'parent', 'burser', 'daarul_iftaa']),
  branchId: z.string().optional(),
  assignedClass: z.string().optional(),
});

const ROLE_LABELS: Record<string, string> = {
  branch_admin: 'Branch Administrator',
  burser: 'Bursar (Financial Receipts & Accounts)',
  daarul_iftaa: 'Daarul Iftaa Admin (Lectures & Media)',
  teacher: 'Teacher',
  parent: 'Parent',
};

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
  "Sakee Branch",
  "AL-ASHED Branch"
];

export default function InviteUserPage() {
  const { user: currentUser } = useAuth();
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const classParam = searchParams.get('class');

  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  // 🔥 Automatically seed branches if missing
  useEffect(() => {
    if (!db || !currentUser) return;

    async function runSeed() {
      if (currentUser.role === 'super_admin') {
        setIsSeeding(true);
        const branchesCollectionRef = collection(db, 'branches');
        const existingSnap = await getDocs(branchesCollectionRef);

        if (existingSnap.empty) {
          console.log("No branches found — seeding...");
          const batch = writeBatch(db);

          BRANCH_NAMES.forEach(name => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            batch.set(doc(branchesCollectionRef, slug), {
              name,
              slug,
              address: name.replace(' Branch', ''),
            });
          });

          await batch.commit();
          console.log("✅ Branches seeded!");
        }

        // Force UI refresh after seeding
        setTimeout(() => setDataVersion(v => v + 1), 700);
        setIsSeeding(false);
      } else {
        setIsSeeding(false);
      }
    }

    runSeed();
  }, [db, currentUser]);

  const branchesQuery = useMemoFirebase(() => {
    if (dataVersion >= 0 && db) {
      return collection(db, 'branches');
    }
    return null;
  }, [dataVersion, db]);

  const { data: branchesRaw, isLoading: branchesLoading } = useCollection(branchesQuery);

  const branches: Branch[] = useMemo(() => {
    const firestoreBranches = branchesRaw?.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
    })) ?? [];

    // Fallback: if Firestore is empty, use static list
    if (firestoreBranches.length === 0) {
      return BRANCH_NAMES.map(name => ({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
      }));
    }

    return firestoreBranches;
  }, [branchesRaw]);

  useEffect(() => {
    // seedBranchesIfNeeded();
  }, []);
  

  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'super_admin') {
      return ['branch_admin', 'burser', 'daarul_iftaa', 'teacher', 'parent'];
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
      assignedClass: '',
    },
  });

  const selectedRole = useWatch({
    control: form.control,
    name: 'role'
  });

  useEffect(() => {
    const defaultRole = (roleParam === 'teacher' || roleParam === 'parent' || roleParam === 'burser' || roleParam === 'branch_admin' || roleParam === 'daarul_iftaa')
      ? roleParam
      : (currentUser?.role === 'branch_admin' ? 'teacher' : 'branch_admin');

    form.reset({
      fullName: '',
      email: '',
      password: '',
      role: defaultRole,
      branchId: currentUser?.role === 'branch_admin' ? (currentUser.branchId || '') : '',
      assignedClass: classParam || '',
    });
  }, [currentUser, roleParam, classParam, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db) return;

    if (values.role === 'teacher' && !values.assignedClass) {
      toast({
        variant: 'destructive',
        title: 'Class Assignment Required',
        description: 'Please select an assigned class for this teacher. Teachers must be assigned to a specific class.',
      });
      return;
    }

    setIsLoading(true);

    const branchToAssign = currentUser?.role === 'branch_admin'
      ? (currentUser.branchId || values.branchId || '')
      : (values.branchId || currentUser?.branchId || '');

    try {
      // Use secondary Firebase app to avoid signing out the current admin
      const secondaryApp = getApps().find(a => a.name === 'SecondaryInvite') || initializeApp(firebaseConfig, 'SecondaryInvite');
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, values.email, values.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        branchId: branchToAssign,
        assignedClass: values.role === 'teacher' ? (values.assignedClass || '') : '',
        status: 'active', // Set default status to active
      });

      await signOut(secondaryAuth);

      toast({
        title: 'User Created Successfully',
        description: `${values.fullName} has been added.`,
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create User',
        description: error.message,
      });
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role] || role.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRole === 'teacher' && (
              <FormField
                control={form.control}
                name="assignedClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Assigned Class / Grade *</span>
                      <span className="text-xs text-primary font-medium">Class Teacher Assignment</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="border-2 font-medium">
                          <SelectValue placeholder="Select assigned class (e.g. JSS 1 A, Basic 1 B)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-72">
                        {CLASS_CATEGORIES.map((category) => (
                          <div key={category} className="py-1">
                            <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 rounded">
                              {category}
                            </div>
                            {SCHOOL_CLASSES.filter((c) => c.category === category).map((cls) => (
                              <SelectItem key={cls.id} value={cls.name} className="py-2">
                                {cls.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This teacher will only be permitted to register students, take attendance, and manage scores under this specific class.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {currentUser?.role === 'branch_admin' ? (
              <div className="space-y-2">
                <FormLabel>Branch</FormLabel>
                <Input
                  readOnly
                  disabled
                  value={branches.find(b => b.id === currentUser.branchId)?.name || currentUser.branchId || 'Assigned to your branch'}
                  className="bg-muted text-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  As a branch administrator, teachers and users added will automatically be assigned to your branch ({branches.find(b => b.id === currentUser.branchId)?.name || currentUser.branchId}).
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={branchesLoading || isSeeding}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id} className="capitalize">
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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

    