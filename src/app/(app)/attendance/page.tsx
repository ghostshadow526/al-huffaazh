
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { collection, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Student } from '../students/student-table';
import { QrScanner } from '@yudiel/react-qr-scanner';

export default function AttendancePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [scannedStudentInfo, setScannedStudentInfo] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(true);

  const handleScan = async (result: string) => {
    if (result && !isProcessing && !scannedStudentInfo) {
      setIsProcessing(true);
      setShowScanner(false); // Hide scanner after a successful scan
      
      let studentId = '';
      try {
        // Handle full URLs or just the ID
        const url = new URL(result);
        const pathParts = url.pathname.split('/');
        studentId = pathParts[pathParts.length - 1];
      } catch (e) {
        // If it's not a valid URL, assume the result is the ID itself
        studentId = result;
      }
      
      if(studentId) {
        setScannedStudentId(studentId);
        try {
            const studentDocRef = doc(firestore, 'students', studentId);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
                const studentData = studentDocSnap.data() as Student;
                setScannedStudentInfo(studentData);
                 toast({
                    title: 'Student Scanned',
                    description: `Found ${studentData.fullName}. Please mark as present.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Student Not Found',
                    description: `No student found with ID: ${studentId}`,
                });
                resetScanner();
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Fetching Student',
                description: error.message,
            });
            resetScanner();
        } finally {
            setIsProcessing(false);
        }
      } else {
         toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'The scanned QR code does not contain a valid student ID.',
        });
        resetScanner();
        setIsProcessing(false);
      }
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    if(error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        })
    } else {
        toast({
            variant: 'destructive',
            title: 'Scanner Error',
            description: 'An unexpected error occurred with the camera. Please ensure it is not being used by another application.',
        })
    }
  }


  const markAsPresent = async () => {
    if (!scannedStudentId || !user || !user.branchId || !firestore || !scannedStudentInfo) return;
    
    setIsProcessing(true);
    try {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeString = today.toTimeString().split(' ')[0]; // HH:MM:SS
        
        const attendanceId = `${scannedStudentId}_${dateString}`;
        const attendanceDocRef = doc(firestore, 'attendance', attendanceId);

        await setDoc(attendanceDocRef, {
            studentId: scannedStudentId,
            branchId: scannedStudentInfo.branchId,
            date: dateString,
            time: timeString,
            status: 'present',
            markedBy: user.uid,
            timestamp: serverTimestamp(),
        }, { merge: true });

        toast({
            title: 'Attendance Marked',
            description: `${scannedStudentInfo?.fullName || 'Student'} marked as present.`,
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
    setScannedStudentId(null);
    setScannedStudentInfo(null);
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
                   <div className="w-full max-w-sm aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                    {showScanner ? (
                        <QrScanner
                            onDecode={handleScan}
                            onError={handleError}
                            containerStyle={{ width: '100%', paddingTop: '100%' }}
                            videoStyle={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                    ) : (
                        <div className="flex items-center space-x-2 p-8 text-center text-muted-foreground">
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>Scan complete. Waiting for action.</span>
                            )}
                        </div>
                    )}
                 </div>
                  {scannedStudentInfo && (
                    <div className="text-center space-y-4">
                        <Alert>
                            <AlertTitle>Student Found: {scannedStudentInfo.fullName}</AlertTitle>
                            <AlertDescription>
                                Class: {scannedStudentInfo.class} <br/>
                                Admission No: {scannedStudentInfo.admissionNo}
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
