
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { doc, serverTimestamp, setDoc, collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import type { Student } from '../students/student-table';
import QRAttendanceScanner from '@/components/QRAttendanceScanner';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Combobox } from '@/components/ui/combobox';

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
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

  // Fetch students for manual attendance
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (user.role === 'super_admin') {
        return collection(firestore, 'students');
    }
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
        return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user, firestore]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  const processStudent = (student: Student) => {
    setScannedStudent(student);
    setShowScanner(false); // Hide scanner/form after selection
    toast({
      title: 'Student Selected',
      description: `Found ${student.fullName}. Please mark as present.`,
    });
  }

  const handleScanSuccess = (student: Student) => {
    processStudent(student);
  };

  const handleManualSelect = (studentId: string) => {
    const student = students?.find(s => s.id === studentId);
    if (student) {
        processStudent(student);
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
    resetScanner();
  }


  const markAsPresent = async () => {
    if (!scannedStudent || !user || !user.branchId || !firestore) return;
    
    setIsProcessing(true);
    try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = today.toTimeString().split(' ')[0]; // HH:MM:SS
        
        const attendanceId = `${scannedStudent.id}_${dateString}`;
        const attendanceDocRef = doc(firestore, 'attendance', attendanceId);

        await setDoc(attendanceDocRef, {
            studentId: scannedStudent.id,
            studentName: scannedStudent.fullName,
            admissionNo: scannedStudent.admissionNo,
            branchId: scannedStudent.branchId,
            date: dateString,
            time: timeString,
            status: 'present',
            markedBy: user.uid,
            timestamp: serverTimestamp(),
        }, { merge: true });

        toast({
            title: 'Attendance Marked',
            description: `${scannedStudent.fullName} marked as present.`,
        });
        resetScanner();

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

  const resetScanner = () => {
    setScannedStudent(null);
    setIsProcessing(false);
    setShowScanner(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>
            You can mark student attendance by scanning their QR code or manually.
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
                   {showScanner ? (
                        <QRAttendanceScanner 
                            onScanSuccess={handleScanSuccess} 
                            onScanError={handleScanError} 
                        />
                    ) : (
                        <div className="flex items-center justify-center p-8 text-center text-muted-foreground w-full max-w-sm aspect-square">
                           <span>Selection complete. Please see details below.</span>
                        </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="manual" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Attendance</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  {showScanner ? (
                        <ManualAttendanceForm 
                            onStudentSelect={handleManualSelect} 
                            students={students || []}
                            isLoading={studentsLoading}
                        />
                    ) : (
                        <div className="flex items-center justify-center p-8 text-center text-muted-foreground w-full">
                           <span>Selection complete. Please see details below.</span>
                        </div>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            {scannedStudent && (
              <div className="text-center space-y-4 mt-6">
                  <Alert>
                      <AlertTitle>Student Found: {scannedStudent.fullName}</AlertTitle>
                      <AlertDescription>
                          Class: {scannedStudent.class} <br/>
                          Admission No: {scannedStudent.admissionNo}
                      </AlertDescription>
                  </Alert>
                  <div className='flex gap-2 justify-center'>
                      <Button onClick={markAsPresent} disabled={isProcessing}>
                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Mark as Present
                      </Button>
                        <Button variant="outline" onClick={resetScanner}>Select Another</Button>
                  </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
