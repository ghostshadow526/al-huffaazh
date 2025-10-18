
'use client';

import React from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import type { Student } from '../students/student-table';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentTable } from '../students/student-table';

export default function ManageStudentsPage() {
  const { user } = useAuth();

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Super admin can see all students
    if (user.role === 'super_admin') {
      return collection(db, 'students');
    }
    // Branch admin and teachers can see students from their branch
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(db, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const canAddStudent = user?.role === 'teacher' || user?.role === 'branch_admin' || user?.role === 'super_admin';


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Students</h2>
          <p className="text-muted-foreground">
            Here you can view and manage student records.
          </p>
        </div>
        {canAddStudent && (
             <div className="flex items-center space-x-2">
                <Button asChild>
                    <Link href="/students/add">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                    </Link>
                </Button>
            </div>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>A list of all students in your view.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentTable columns={['photoUrl', 'fullName', 'class', 'admissionNo', 'branchId', 'parentEmail', 'actions']} data={students || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
