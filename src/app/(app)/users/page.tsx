'use client';

import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTable } from './user-table';
import { InviteUserDialog } from './invite-user-dialog';
import { User } from '@/components/auth-provider';

export default function UsersPage() {
  const { user } = useAuth();
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (user.role === 'super_admin') {
      return collection(db, 'users');
    }
    if (user.role === 'branch_admin' && user.branchId) {
      return query(collection(db, 'users'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
          <p className="text-muted-foreground">
            Here you can view, invite, and manage users for your branch.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setInviteDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
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
      <InviteUserDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        currentUser={user}
      />
    </>
  );
}
