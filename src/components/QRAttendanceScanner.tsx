
'use client';

import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { type Student } from '@/app/(dashboard)/students/student-table';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Button } from './ui/button';
import { useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

interface QRAttendanceScannerProps {
  onScanSuccess: (student: Student) => void;
  onScanError: (message: string) => void;
  isProcessing: boolean;
}

const findStudentByQR = async (qrValue: string, firestore: Firestore | null): Promise<Student | null> => {
  if (!firestore) {
    throw new Error("Firestore is not initialized.");
  }
  
  let studentId = '';
  try {
    const url = new URL(qrValue);
    const pathParts = url.pathname.split('/');
    studentId = pathParts[pathParts.length - 1];
  } catch (e) {
    // If it's not a full URL, assume the QR code just contains the studentId
    studentId = qrValue;
  }

  if (!studentId) return null;

  const studentDocRef = doc(firestore, 'students', studentId);
  const studentDocSnap = await getDoc(studentDocRef);

  if (studentDocSnap.exists()) {
    return { id: studentDocSnap.id, ...studentDocSnap.data() } as Student;
  } else {
    return null;
  }
};


const QRAttendanceScanner: React.FC<QRAttendanceScannerProps> = ({ onScanSuccess, onScanError, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    const qrScanner = new QrScanner(
      videoElem,
      async (result) => {
        if (isProcessing) return;
        qrScanner.pause();
        try {
          const student = await findStudentByQR(result.data, firestore);
          if (student) {
            onScanSuccess(student);
          } else {
            onScanError('Student not found for this QR code.');
          }
        } catch (e: any) {
          onScanError(e.message || 'Error processing QR code');
        } finally {
          // Add a short delay before resuming to prevent rapid-fire scans
          setTimeout(() => qrScanner.start(), 2000);
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );
    setScanner(qrScanner);
    
    qrScanner.start().catch(err => {
        setHasCamera(false);
        onScanError(err.message || "Could not start camera.");
    });
    
    QrScanner.hasCamera().then(setHasCamera);
    
    return () => {
      qrScanner?.destroy();
      setScanner(null);
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, isProcessing]);


  return (
    <div className="flex flex-col items-center gap-4 w-full">
       <div className="w-full max-w-sm aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
          <video ref={videoRef} className="w-full h-full object-cover" />
           {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Marking attendance...</p>
            </div>
          )}
          {!isProcessing && hasCamera && (
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-2/3 h-2/3 border-4 border-primary/50 rounded-lg shadow-lg"></div>
              <p className="mt-4 text-sm text-primary-foreground bg-black/50 px-2 py-1 rounded-md">
                Position QR code within the frame
              </p>
            </div>
          )}
      </div>
      {!hasCamera && (
        <p className="text-sm text-destructive">
          No camera found. Please use a device with a camera or use the manual entry tab.
        </p>
      )}
    </div>
  );
};

export default QRAttendanceScanner;
