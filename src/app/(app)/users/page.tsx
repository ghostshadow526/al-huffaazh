
'use client';

import React from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useAuth, User } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTable } from './user-table';

export default function UsersPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    if (user.role === 'super_admin') {
      return collection(firestore, 'users');
    }
    if (user.role === 'branch_admin' && user.branchId) {
      return query(collection(firestore, 'users'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user?.uid, user?.role, user?.branchId, firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
          <p className="text-muted-foreground">
            Here you can view, invite, and manage users for your branch.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/users/invite">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable columns={['fullName', 'email', 'role', 'branchId']} data={users || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
