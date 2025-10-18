
"use client";
import { useAuth } from "@/components/auth-provider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, CreditCard } from "lucide-react";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const studentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (user.role === 'super_admin') {
      return collection(db, 'students');
    }
    if (user.role === 'branch_admin' || user.role === 'teacher') {
      return query(collection(db, 'students'), where('branchId', '==', user.branchId));
    }
    // Parents don't see student list this way
    return null;
  }, [user]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    let q = query(collection(db, 'payments'), where('status', '==', 'pending'));
    if (user.role === 'branch_admin' || user.role === 'parent') {
        q = query(q, where('branchId', '==', user.branchId));
    }
    // Teachers don't see payments. Super admin sees all.
    if (user.role === 'teacher') return null;

    return q;
  }, [user]);


  const { data: students, isLoading: studentsLoading } = useCollection(studentsQuery);
  const { data: payments, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  useEffect(() => {
      if(!studentsLoading) {
        setStudentCount(students?.length || 0);
      }
      if(!paymentsLoading) {
        setPendingPayments(payments?.length || 0);
      }
      if(!studentsLoading && !paymentsLoading) {
        setLoadingStats(false);
      }
  }, [students, payments, studentsLoading, paymentsLoading])


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {user?.fullName || user?.email}!</h1>
        <p className="text-muted-foreground">Here's a summary of the academy portal.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.role?.replace('_', ' ')}</div>
            <p className="text-xs text-muted-foreground">Permissions are based on this role</p>
          </CardContent>
        </Card>
        {(user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'teacher') && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loadingStats ? <div className="text-2xl font-bold">...</div> : <div className="text-2xl font-bold">{studentCount}</div>}
                <p className="text-xs text-muted-foreground">{user?.role === 'super_admin' ? 'Across all branches' : 'In your branch'}</p>
            </CardContent>
            </Card>
        )}
        {(user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'parent') && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loadingStats ? <div className="text-2xl font-bold">...</div> : <div className="text-2xl font-bold">{pendingPayments}</div>}
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
            </Card>
        )}
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Based on your role, here are some things you can do.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your quick actions here...</p>
          </CardContent>
        </Card>
    </div>
  );
}

    