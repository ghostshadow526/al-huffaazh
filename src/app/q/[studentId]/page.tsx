
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';

interface Student {
  fullName: string;
  class: string;
  admissionNo: string;
  photoUrl: string;
  dob: string;
  address: string;
  gender: string;
  qrImageUrl?: string;
  branchId?: string;
}

interface Branch {
    name: string;
    address: string;
}


export default function StudentIdCardPage() {
  const params = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const studentId = params.studentId;
    if (!studentId || !firestore) {
        setIsLoading(false);
        return;
    }

    const fetchStudentData = async () => {
      try {
        const studentDocRef = doc(firestore, 'students', studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (!studentDocSnap.exists()) {
          return notFound();
        }

        const studentData = studentDocSnap.data() as any; // Firestore data
        setStudent(studentData);
        
        if (studentData.branchId) {
            const branchDocRef = doc(firestore, 'branches', studentData.branchId);
            const branchDocSnap = await getDoc(branchDocRef);
            if (branchDocSnap.exists()) {
                setBranch(branchDocSnap.data() as Branch);
            }
        }
        
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [params.studentId, firestore]);

  if (isLoading) {
    return <IdCardSkeleton />;
  }

  if (!student) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden border-accent border-4 bg-gradient-to-br from-primary/20 to-background">
        <CardHeader className="bg-accent/80 p-4 text-accent-foreground">
            <div className="flex items-center gap-3">
                <Logo className="h-12 w-12 text-white" />
                <div>
                    <h1 className="text-xl font-bold">Al-Huffaazh Academy</h1>
                    <p className="text-sm font-light">{branch?.name ?? 'Main Branch'}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-md">
              <AvatarImage src={student.photoUrl} alt={student.fullName} />
              <AvatarFallback className="text-4xl">
                {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
             {student.qrImageUrl && (
                <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-md shadow-md">
                    <Image src={student.qrImageUrl} alt="QR Code" width={40} height={40} />
                </div>
             )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{student.fullName}</h2>
            <p className="text-base text-muted-foreground font-mono">{student.admissionNo}</p>
          </div>

          <div className="w-full text-left space-y-3 pt-4 border-t">
             <InfoRow label="Class" value={student.class} />
             <InfoRow label="Date of Birth" value={format(new Date(student.dob), 'MMMM d, yyyy')} />
             <InfoRow label="Gender" value={student.gender} className="capitalize" />
             <InfoRow label="Address" value={student.address} />
             <InfoRow label="Branch Address" value={branch?.address || 'N/A'} />
          </div>

           <p className="text-xs text-muted-foreground pt-4">This card is the property of Al-Huffaazh Academy.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string, value: string, className?: string }) {
    return (
        <div className="flex justify-between items-start gap-2">
            <span className="text-sm font-semibold text-muted-foreground shrink-0">{label}:</span>
            <span className={cn("text-sm text-right font-medium text-foreground", className)}>{value}</span>
        </div>
    )
}

function IdCardSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden">
        <CardHeader className="bg-muted p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="w-full text-left space-y-4 pt-4 border-t">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
