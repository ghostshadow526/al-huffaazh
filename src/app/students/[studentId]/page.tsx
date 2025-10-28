
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import type { Student } from '../student-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ParentCredential {
  email: string;
  password?: string;
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [credential, setCredential] = useState<ParentCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const studentId = params.studentId;
    if (!studentId || !firestore) {
      setIsLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studentDocRef = doc(firestore, 'students', studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (!studentDocSnap.exists()) {
          setIsLoading(false);
          notFound();
          return;
        }

        const studentData = { id: studentDocSnap.id, ...studentDocSnap.data() } as Student;
        setStudent(studentData);

        // Now fetch parent credentials if parentUserId exists
        if (studentData.parentUserId) {
            const credDocRef = doc(firestore, 'parentCredentials', studentData.parentUserId);
            const credDocSnap = await getDoc(credDocRef);
            if (credDocSnap.exists()) {
                setCredential(credDocSnap.data() as ParentCredential);
            }
        }

      } catch (err: any) {
        console.error("Error fetching student data:", err);
        setError("Failed to load student data. It could be a permission or network issue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [params.studentId, firestore]);

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error) {
    return (
     <Alert variant="destructive">
         <AlertTitle>Error</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
     </Alert>
    );
  }

  if (!student) {
    // This case should be handled by notFound() in useEffect, but as a fallback:
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24 border-2">
                    <AvatarImage src={student.photoUrl} alt={student.fullName} />
                    <AvatarFallback>{student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-3xl">{student.fullName}</CardTitle>
                    <CardDescription>Detailed information for admission number: {student.admissionNo}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 border-t">
              <InfoRow label="Full Name" value={student.fullName} />
              <InfoRow label="Admission Number" value={student.admissionNo} />
              <InfoRow label="Class" value={student.class} />
              <InfoRow label="Date of Birth" value={format(new Date(student.dob), 'MMMM d, yyyy')} />
              <InfoRow label="Branch ID" value={student.branchId} />
              <InfoRow label="Parent's Email" value={student.parentEmail} />
          </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Parent Login Credentials</CardTitle>
              <CardDescription>
              These are the temporary login details for the student's parent.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {credential && credential.password ? (
              <>
               <div className="space-y-1">
                  <Label htmlFor="parent-email">Parent Email</Label>
                  <div className="flex items-center gap-2">
                      <Input id="parent-email" value={credential.email} readOnly />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(credential.email)}>
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
               <div className="space-y-1">
                  <Label htmlFor="parent-password">Temporary Password</Label>
                   <div className="flex items-center gap-2">
                      <Input id="parent-password" type={passwordVisible ? 'text' : 'password'} value={credential.password} readOnly />
                      <Button variant="outline" size="icon" onClick={() => setPasswordVisible(!passwordVisible)}>
                          {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(credential.password || '')}>
                          <Copy className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
              </>
              ) : (
                  <Alert>
                      <AlertTitle>Credentials Status</AlertTitle>
                      <AlertDescription>
                          { student.parentUserId ? 
                          'The temporary credentials for this parent have expired or are no longer available. If the parent cannot log in, their password may need to be reset.' : 
                          'No parent account is linked to this student.'
                          }
                      </AlertDescription>
                  </Alert>
              )}
          </CardContent>
          <CardFooter>
               <p className="text-xs text-muted-foreground">
                  Note: Temporary passwords are created during student registration and may have expired.
               </p>
          </CardFooter>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value || 'N/A'}</p>
    </div>
  );
}

function DetailPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-24 h-24 rounded-full" />
                        <div className='space-y-2'>
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 border-t">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
