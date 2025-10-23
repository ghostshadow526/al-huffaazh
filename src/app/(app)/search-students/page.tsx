
'use client';

import React, { useState, useMemo } from 'react';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import type { Student } from '../students/student-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StudentTable } from '../students/student-table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Search } from 'lucide-react';

export default function SearchStudentsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !searchQuery) return null;

    // Capitalize search query for case-insensitive search on capitalized names
    const capitalizedQuery = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1);

    const baseQuery = query(
      collection(firestore, 'students'),
      where('fullName', '>=', capitalizedQuery),
      where('fullName', '<=', capitalizedQuery + '\uf8ff'),
      limit(10)
    );

    if (user.role === 'branch_admin' && user.branchId) {
      return query(baseQuery, where('branchId', '==', user.branchId));
    }
    
    if (user.role === 'super_admin') {
      return baseQuery;
    }

    return null;
  }, [user, firestore, searchQuery]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  const canSearch = user?.role === 'branch_admin' || user?.role === 'super_admin';

  if (!canSearch) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>You do not have permission to access this page.</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Search Students</h2>
        <p className="text-muted-foreground">
          Find student records by typing their name in the search bar below.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student Search</CardTitle>
          <CardDescription>Enter a student's name to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <Input
              placeholder="Search by full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg"
            />
          </div>
          <div className="mt-6">
            {searchQuery && students && students.length === 0 && !isLoading && (
              <Alert>
                <Search className="h-4 w-4" />
                <AlertTitle>No Results</AlertTitle>
                <AlertDescription>
                  No students found matching your search query.
                </AlertDescription>
              </Alert>
            )}
            {(students && students.length > 0 || isLoading) && (
              <StudentTable
                columns={['photoUrl', 'fullName', 'class', 'admissionNo', 'branchId', 'actions']}
                data={students || []}
                isLoading={isLoading && !!searchQuery}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
