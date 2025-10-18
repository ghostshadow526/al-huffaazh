
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Student } from '../students/student-table';
import QRAttendanceScanner from '@/components/QRAttendanceScanner';

export default function AttendancePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

  const handleScanSuccess = (student: Student) => {
    setScannedStudent(student);
    setShowScanner(false);
    toast({
      title: 'Student Scanned',
      description: `Found ${student.fullName}. Please mark as present.`,
    });
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
                           <span>Scan complete. Please see details below.</span>
                        </div>
                    )}
                  {scannedStudent && (
                    <div className="text-center space-y-4">
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
                             <Button variant="outline" onClick={resetScanner}>Scan Another</Button>
                        </div>
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
                <CardContent>
                  <p>Manual attendance entry form will be implemented here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
