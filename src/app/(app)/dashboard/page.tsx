
"use client";
import { useAuth, UserRole } from "@/components/auth-provider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, CreditCard, UserPlus, ClipboardList, CalendarCheck, ResultIcon } from "lucide-react";
import { useMemoFirebase, useFirestore } from "@/firebase/provider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const quickActions: { href: string; label: string; description: string; icon: React.ElementType; roles: UserRole[] }[] = [
    { href: "/students/add", label: "Add a new student", description: "Enroll a new student and create their parent's account.", icon: UserPlus, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/manage-students", label: "Manage student records", description: "View, and see details of existing students.", icon: ClipboardList, roles: ['super_admin', 'branch_admin', 'teacher'] },
    { href: "/attendance", label: "Take attendance", description: "Mark daily attendance by scanning student QR codes.", icon: CalendarCheck, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/results", label: "Enter student results", description: "Input term results and grades for your students.", icon: ResultIcon, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/payments", label: "Confirm payments", description: "Review and confirm submitted fee payments.", icon: CreditCard, roles: ['super_admin', 'branch_admin'] },
    { href: "/payments", label: "View payment history", description: "Check your payment status and upload receipts.", icon: CreditCard, roles: ['parent'] },
    { href: "/users/invite", label: "Create a new user", description: "Invite new teachers or administrators to the system.", icon: UserPlus, roles: ['super_admin', 'branch_admin'] },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [studentCount, setStudentCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (user.role === 'super_admin') {
      return collection(firestore, 'students');
    }
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    // Parents don't see student list this way
    return null;
  }, [user, firestore]);

  const paymentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    let q = query(collection(firestore, 'payments'), where('status', '==', 'pending'));
    if ((user.role === 'branch_admin' || user.role === 'parent') && user.branchId) {
        q = query(q, where('branchId', '==', user.branchId));
    }
    // Teachers don't see payments. Super admin sees all.
    if (user.role === 'teacher') return null;

    return q;
  }, [user, firestore]);


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
  
  const availableActions = user?.role ? quickActions.filter(action => action.roles.includes(user.role as UserRole)) : [];


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
            {availableActions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableActions.map((action) => (
                        <Button key={action.href} asChild variant="outline" className="h-auto text-left justify-start items-start">
                            <Link href={action.href} className="flex gap-4 p-4 items-center">
                                <action.icon className="h-6 w-6 text-accent" />
                                <div className="flex flex-col">
                                    <span className="font-semibold">{action.label}</span>
                                    <span className="text-sm text-muted-foreground">{action.description}</span>
                                </div>
                            </Link>
                        </Button>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No specific actions available for your role at the moment.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
