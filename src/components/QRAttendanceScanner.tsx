
'use client';

import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Loader2 } from 'lucide-react';

interface QRAttendanceScannerProps {
  onScanSuccess: (studentId: string) => void;
  onScanError: (message: string) => void;
  isProcessing: boolean;
}

const getStudentIdFromQR = (qrValue: string): string | null => {
  try {
    const url = new URL(qrValue);
    const pathParts = url.pathname.split('/');
    const studentId = pathParts[pathParts.length - 1];
    return studentId || null;
  } catch (e) {
    // If it's not a full URL, assume the QR code just contains the studentId
    return qrValue.trim() || null;
  }
};


const QRAttendanceScanner: React.FC<QRAttendanceScannerProps> = ({ onScanSuccess, onScanError, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    let isScannerPaused = false;

    const qrScanner = new QrScanner(
      videoElem,
      async (result) => {
        if (isProcessing || isScannerPaused) return;
        
        isScannerPaused = true;
        qrScanner?.pause();
        try {
          const studentId = getStudentIdFromQR(result.data);
          if (studentId) {
            onScanSuccess(studentId);
          } else {
            onScanError('QR code is not a valid student ID.');
          }
        } catch (e: any) {
          onScanError(e.message || 'Error processing QR code');
        } 
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );
    
    qrScannerRef.current = qrScanner;

    const startScanner = () => {
        qrScanner.start().catch(err => {
            setHasCamera(false);
            if (err.name === 'NotAllowedError') {
                 onScanError("Camera access was denied. Please grant permission in your browser settings.");
            } else {
                 onScanError(err.message || "Could not start camera.");
            }
        });
    };
    
    startScanner();
    
    QrScanner.hasCamera().then(setHasCamera);

    // This effect runs only when isProcessing changes from true to false
    if (!isProcessing) {
        isScannerPaused = false;
        startScanner(); // Restart scanner when processing is done
    }
    
    return () => {
      qrScanner?.destroy();
      qrScannerRef.current = null;
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);


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
              <p className="mt-4 text-sm text-white bg-black/50 px-2 py-1 rounded-md">
                Position QR code within the frame
              </p>
            </div>
          )}
      </div>
      {!hasCamera && (
        <p className="text-sm text-destructive text-center max-w-xs">
          Camera not found or access denied. Please use a device with a camera and grant permission, or use the manual entry tab.
        </p>
      )}
    </div>
  );
};

export default QRAttendanceScanner;
