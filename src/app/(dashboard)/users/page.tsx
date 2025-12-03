

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useAuth, User } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserTable } from './user-table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function UsersPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    let q = collection(firestore, 'users');

    if (user.role === 'branch_admin' && user.branchId) {
      q = query(q, where('branchId', '==', user.branchId));
    } else if (user.role !== 'super_admin') {
      // For teachers or other roles, return a query that yields no results
      // as they should not be able to list users.
      return query(collection(firestore, 'users'), where('uid', '==', 'nonexistent'));
    }
    
    // Admins can see all users, super_admin has been handled by not adding a where clause
    return q;
  }, [user?.uid, user?.role, user?.branchId, firestore]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const filteredUsers = (roles: string[]) => {
      if (!users) return [];
      return users.filter(u => u.role && roles.includes(u.role));
  }
  
  const teachers = useMemo(() => filteredUsers(['teacher']), [users]);
  const parents = useMemo(() => filteredUsers(['parent']), [users]);
  const admins = useMemo(() => filteredUsers(['branch_admin', 'super_admin']), [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
          <p className="text-muted-foreground">
            View, invite, and manage users for your branch.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button asChild>
            <Link href="/users/invite">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New User
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="teachers">
        <TabsList>
          <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="parents">Parents ({parents.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="teachers">
            <Card>
                <CardHeader>
                    <CardTitle>Teachers</CardTitle>
                    <CardDescription>A list of all teachers in your view.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable columns={['fullName', 'email', 'branchId', 'status', 'actions']} data={teachers} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="parents">
            <Card>
                <CardHeader>
                    <CardTitle>Parents</CardTitle>
                    <CardDescription>A list of all parents in your view.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable columns={['fullName', 'email', 'branchId', 'status', 'actions']} data={parents} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="admins">
            <Card>
                <CardHeader>
                    <CardTitle>Administrators</CardTitle>
                    <CardDescription>A list of all administrators in your view.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable columns={['fullName', 'email', 'branchId', 'status', 'actions']} data={admins} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
