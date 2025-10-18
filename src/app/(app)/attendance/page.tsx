
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
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

// Dynamically import the QR scanner only on the client side
import dynamic from 'next/dynamic';
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function AttendancePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [scannedStudentInfo, setScannedStudentInfo] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);


  useEffect(() => {
    // Check for camera permission when component mounts
    const getCameraPermission = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      } else {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
    
    // Clean up the stream when component unmounts
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleScan = async (data: { text: string } | null) => {
    if (data && !isProcessing) {
      setIsProcessing(true);
      const urlParts = data.text.split('/');
      const studentId = urlParts.pop(); // Get the last part of the URL
      
      if(studentId) {
        setScannedStudentId(studentId);
        try {
            const studentDocRef = doc(firestore, 'students', studentId);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
                const studentData = studentDocSnap.data() as Student;
                setScannedStudentInfo(studentData);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Student Not Found',
                    description: `No student found with ID: ${studentId}`,
                });
                setScannedStudentInfo(null);
                setIsProcessing(false);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Fetching Student',
                description: error.message,
            });
            setIsProcessing(false);
        }
      } else {
         toast({
            variant: 'destructive',
            title: 'Invalid QR Code',
            description: 'The scanned QR code does not contain a valid student URL.',
        });
        setIsProcessing(false);
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    toast({
      variant: 'destructive',
      title: 'QR Scan Error',
      description: 'There was an error with the camera or QR scanner. Please ensure permissions are enabled.',
    });
  };

  const markAsPresent = async () => {
    if (!scannedStudentId || !user || !user.branchId || !firestore) return;
    
    setIsProcessing(true);
    try {
        const attendanceColRef = collection(firestore, 'attendance');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const attendanceId = `${scannedStudentId}_${today}`;
        const attendanceDocRef = doc(attendanceColRef, attendanceId);

        await setDoc(attendanceDocRef, {
            studentId: scannedStudentId,
            branchId: user.branchId,
            date: today,
            status: 'present',
            markedBy: user.uid,
            timestamp: serverTimestamp(),
        });

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
                  {hasCameraPermission === null && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Checking camera permissions...</span>
                    </div>
                  )}
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>
                        Please enable camera permissions in your browser settings to use the QR scanner.
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasCameraPermission === true && !scannedStudentInfo && (
                     <div className="w-full max-w-sm aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        <Suspense fallback={<Loader2 className="animate-spin"/>}>
                            <QrScanner
                                onScan={handleScan}
                                onError={handleError}
                                style={{ width: '100%' }}
                                constraints={{ video: { facingMode: 'environment' } }}
                            />
                        </Suspense>
                     </div>
                  )}
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
