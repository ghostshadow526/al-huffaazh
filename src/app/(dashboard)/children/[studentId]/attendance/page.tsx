

'use client';

import { useParams, notFound } from 'next/navigation';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { Student } from '@/app/(dashboard)/students/student-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AttendanceRecord {
    id: string;
    date: string;
    time: string;
    status: 'present' | 'absent' | 'late';
}

export default function ChildAttendancePage() {
    const params = useParams();
    const studentId = params.studentId as string;
    const firestore = useFirestore();

    const [student, setStudent] = useState<Student | null>(null);
    const [studentLoading, setStudentLoading] = useState(true);

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return query(
            collection(firestore, 'attendance'),
            where('studentId', '==', studentId)
        );
    }, [firestore, studentId]);

    const { data: attendance, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(attendanceQuery);

    useEffect(() => {
        if (!firestore || !studentId) return;
        const fetchStudent = async () => {
            setStudentLoading(true);
            const studentDoc = await getDoc(doc(firestore, 'students', studentId));
            if (studentDoc.exists()) {
                setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
            } else {
                notFound();
            }
            setStudentLoading(false);
        };
        fetchStudent();
    }, [firestore, studentId]);

    if (studentLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!student) {
        return notFound();
    }
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance History</h2>
                    <p className="text-muted-foreground">Showing records for {student.fullName}</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Records</CardTitle>
                    <CardDescription>A complete log of attendance marked by teachers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {attendanceLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance && attendance.length > 0 ? (
                                    attendance.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell>{format(new Date(record.date), 'PPPP')}</TableCell>
                                            <TableCell>{record.time}</TableCell>
                                            <TableCell>
                                                <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'} className={cn(
                                                    record.status === 'present' && "bg-green-100 text-green-800",
                                                    record.status === 'late' && "bg-yellow-100 text-yellow-800",
                                                )}>
                                                    {record.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No attendance records found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    
