
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { doc, serverTimestamp, setDoc, collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import type { Student } from '../students/student-table';
import QRAttendanceScanner from '@/components/QRAttendanceScanner';
import { Combobox } from '@/components/ui/combobox';
import { format } from 'date-fns';

function ManualAttendanceForm({ onStudentSelect, students, isLoading }: { onStudentSelect: (studentId: string) => void, students: Student[], isLoading: boolean }) {
    const studentOptions = students.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));

    return (
        <div className="flex flex-col gap-4 items-center">
            <p className="text-sm text-muted-foreground">Select a student from the list to mark their attendance.</p>
            <Combobox
                options={studentOptions}
                onSelect={value => onStudentSelect(value)}
                placeholder="Select student..."
                searchText="Search for a student..."
                disabled={isLoading}
            />
            {isLoading && <p className="text-sm text-muted-foreground">Loading students...</p>}
        </div>
    );
}


export default function AttendancePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [lastMarkedStudent, setLastMarkedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch students for manual attendance
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    if (user.role === 'super_admin') {
        return collection(firestore, 'students');
    }
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
        return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user?.uid, user?.role, user?.branchId, firestore]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  const markStudentAsPresent = async (student: Student) => {
    if (!student || !user || !user.branchId || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot mark attendance. User or student data is missing.',
        });
        return;
    }
    
    setIsProcessing(true);
    setLastMarkedStudent(null); // Clear previous student

    try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = today.toTimeString().split(' ')[0]; // HH:MM:SS
        
        const attendanceId = `${student.id}_${dateString}`;
        const attendanceDocRef = doc(firestore, 'attendance', attendanceId);

        await setDoc(attendanceDocRef, {
            studentId: student.id,
            studentName: student.fullName,
            admissionNo: student.admissionNo,
            branchId: student.branchId,
            date: dateString,
            time: timeString,
            status: 'present',
            markedBy: user.uid,
            timestamp: serverTimestamp(),
        }, { merge: true });

        setLastMarkedStudent(student); // Show who was just marked
        toast({
            title: 'Attendance Marked',
            description: `${student.fullName} marked as present for ${format(today, 'PPPP')}.`,
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Mark Attendance',
            description: error.message,
        });
    } finally {
        setIsProcessing(false);
    }
  };


  const handleScanSuccess = (student: Student) => {
    markStudentAsPresent(student);
  };

  const handleManualSelect = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    if (student) {
        markStudentAsPresent(student);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find the selected student.'
        })
    }
  };


  const handleScanError = (message: string) => {
    if (message.includes('permission') || message.includes('camera')) {
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Scanner Error',
            description: message,
        });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>
            Today is {format(new Date(), 'eeee, MMMM do, yyyy')}. You can mark student attendance by scanning their QR code or manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            <TabsContent value="scan" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Scanner</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <QRAttendanceScanner 
                        onScanSuccess={handleScanSuccess} 
                        onScanError={handleScanError} 
                        isProcessing={isProcessing}
                    />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="manual" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Attendance</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <ManualAttendanceForm 
                        onStudentSelect={handleManualSelect} 
                        students={students || []}
                        isLoading={studentsLoading || isProcessing}
                    />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

           {isProcessing && (
                <div className="text-center space-y-4 mt-6 flex justify-center items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing attendance...</span>
                </div>
            )}
            
            {lastMarkedStudent && !isProcessing && (
              <div className="text-center space-y-4 mt-6">
                  <Alert variant="default" className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Success: {lastMarkedStudent.fullName} Marked Present</AlertTitle>
                      <AlertDescription className="text-green-700">
                          Class: {lastMarkedStudent.class} <br/>
                          Admission No: {lastMarkedStudent.admissionNo}
                      </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">You can now mark another student.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
