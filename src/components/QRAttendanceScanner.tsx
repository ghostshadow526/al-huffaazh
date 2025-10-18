'use client';

import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { type Student } from '@/app/(app)/students/student-table';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Button } from './ui/button';
import { useFirestore } from '@/firebase';

interface QRAttendanceScannerProps {
  onScanSuccess: (student: Student) => void;
  onScanError: (message: string) => void;
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


const QRAttendanceScanner: React.FC<QRAttendanceScannerProps> = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    startScanning();
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setScanning(true);
      
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleScanResult(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await scanner.start();
      setQrScanner(scanner);
    } catch (error: any) {
      console.error('Error starting QR scanner:', error);
      const errorMessage = error.message || 'Failed to start camera. Please check permissions.';
      setError(errorMessage);
      onScanError(errorMessage)
      setScanning(false);
    }
  };

  const handleScanResult = async (qrValue: string) => {
    if (loading) return; 
    
    setLoading(true);
    setError('');

    try {
      const student = await findStudentByQR(qrValue, firestore);
      
      if (student) {
        if (qrScanner) {
          qrScanner.stop();
        }
        setScanning(false);
        onScanSuccess(student);
      } else {
        const errorMessage = 'Student not found for this QR code';
        setError(errorMessage);
        onScanError(errorMessage);
        setTimeout(() => {
          setError('');
          setLoading(false);
        }, 2000);
        return;
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      const errorMessage = 'Error processing QR code';
      setError(errorMessage);
      onScanError(errorMessage);
      setTimeout(() => {
        setError('');
        setLoading(false);
      }, 2000);
      return;
    }
    
    setLoading(false);
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      setQrScanner(null);
    }
    setScanning(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
       <div className="w-full max-w-sm aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />
        
        {scanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-2/3 h-2/3 border-4 border-primary/50 rounded-lg shadow-lg"></div>
            <p className="mt-4 text-sm text-primary-foreground bg-black/50 px-2 py-1 rounded-md">
              {loading ? 'Processing...' : 'Position QR code within the frame'}
            </p>
          </div>
        )}
      </div>

       {error && (
          <div className="text-destructive text-center">
            <p>{error}</p>
            <Button onClick={startScanning} variant="secondary" size="sm" className="mt-2">
              Try Again
            </Button>
          </div>
        )}

      <div className="flex gap-2">
        {scanning ? (
          <Button onClick={stopScanning} variant="outline">
            Stop Scanning
          </Button>
        ) : (
          <Button onClick={startScanning}>
            Start Scanning
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRAttendanceScanner;
