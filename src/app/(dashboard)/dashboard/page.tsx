
"use client";
import { useAuth, UserRole } from "@/components/auth-provider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, CreditCard, UserPlus, ClipboardList, CalendarCheck, GraduationCap, User as UserIcon } from "lucide-react";
import { useMemoFirebase, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Student } from "../students/student-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions: { href: string; label: string; description: string; icon: React.ElementType; roles: UserRole[] }[] = [
    { href: "/students/add", label: "Add a new student", description: "Enroll a new student and create their parent's account.", icon: UserPlus, roles: ['branch_admin', 'super_admin'] },
    { href: "/manage-students", label: "Manage student records", description: "View, and see details of existing students.", icon: ClipboardList, roles: ['super_admin', 'branch_admin', 'teacher'] },
    { href: "/attendance", label: "Take attendance", description: "Mark daily attendance by scanning student QR codes.", icon: CalendarCheck, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/results", label: "Enter results", description: "Input student scores and upload report cards.", icon: GraduationCap, roles: ['teacher', 'branch_admin', 'super_admin'] },
    { href: "/admin/transactions", label: "Confirm payments", description: "Review and confirm submitted fee payments.", icon: CreditCard, roles: ['super_admin', 'branch_admin'] },
    { href: "/transactions", label: "View payment history", description: "Check your payment status and upload receipts.", icon: CreditCard, roles: ['parent'] },
    { href: "/users/invite", label: "Create a new user", description: "Invite new teachers or administrators to the system.", icon: UserPlus, roles: ['super_admin', 'branch_admin'] },
];

function ParentDashboard({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
    const firestore = useFirestore();
    const childrenQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    }, [firestore, user?.uid]);

    const { data: children, isLoading } = useCollection<Student>(childrenQuery);

    return (
         <Card>
          <CardHeader>
            <CardTitle>My Children</CardTitle>
            <CardDescription>View academic progress for your children enrolled in the academy.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>}
            {!isLoading && children?.length === 0 && <p className="text-muted-foreground">You do not have any children linked to your account.</p>}
            
            {children && children.length > 0 && (
                <div className="space-y-4">
                    {children.map(child => (
                        <Card key={child.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={child.photoUrl} alt={child.fullName} />
                                <AvatarFallback>{child.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="font-semibold">{child.fullName}</p>
                                <p className="text-sm text-muted-foreground">{child.class} - {child.admissionNo}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                <Button asChild size="sm">
                                    <Link href={`/children/${child.id}/attendance`}>
                                        <CalendarCheck className="mr-2 h-4 w-4"/>
                                        Attendance
                                    </Link>
                                </Button>
                                 <Button asChild size="sm" variant="outline">
                                    <Link href={`/children/${child.id}/results`}>
                                        <GraduationCap className="mr-2 h-4 w-4"/>
                                        Results
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [studentCount, setStudentCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !user.uid) return null;
    if (user.role === 'super_admin') {
      return collection(firestore, 'students');
    }
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user, firestore]);


  const { data: students, isLoading: studentsLoading } = useCollection(studentsQuery);

  useEffect(() => {
      if(!studentsLoading) {
        setStudentCount(students?.length || 0);
        setLoadingStats(false);
      }
  }, [students, studentsLoading])
  
  const availableActions = user?.role ? quickActions.filter(action => action.roles.includes(user.role as UserRole)) : [];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome, {user?.fullName || user?.email}!</h1>
        <p className="text-muted-foreground">Here's a summary of your portal.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
             <UserIcon className="h-4 w-4 text-muted-foreground" />
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
      </div>

       {user.role === 'parent' ? <ParentDashboard user={user} /> : (
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
       )}
    </div>
  );
}
