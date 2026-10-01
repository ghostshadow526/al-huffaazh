

'use client';

import React from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import type { Student } from './student-table';

import { PlusCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentTable } from './student-table';

export default function StudentsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    // Super admin can see all students
    if (user.role === 'super_admin') {
      return collection(firestore, 'students');
    }
    // Branch admin and teachers can see students from their branch
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user?.uid, user?.role, user?.branchId, firestore]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const canAddStudent = user?.role === 'branch_admin' || user?.role === 'super_admin';
  const canManageTeachers = user?.role === 'branch_admin' || user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground text-sm">
            A list of all students in your view.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManageTeachers && (
            <Button variant="outline" asChild>
              <Link href="/users/invite?role=teacher">
                <GraduationCap className="mr-2 h-4 w-4 text-primary" /> Register Teacher Under Class
              </Link>
            </Button>
          )}
          {canAddStudent && (
            <Button asChild>
              <Link href="/students/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
              </Link>
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>This is a list of all students.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentTable columns={['photoUrl', 'fullName', 'class', 'admissionNo', 'branchId', 'parentEmail', 'actions']} data={students || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
