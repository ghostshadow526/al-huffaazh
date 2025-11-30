
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useAuth, User } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';

import { PlusCircle, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <div className="flex items-center space-x-2">
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
                    <UserTable columns={['fullName', 'email', 'branchId', 'actions']} data={teachers} isLoading={isLoading} />
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
                    <UserTable columns={['fullName', 'email', 'branchId', 'actions']} data={parents} isLoading={isLoading} />
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
                    <UserTable columns={['fullName', 'email', 'branchId', 'actions']} data={admins} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
