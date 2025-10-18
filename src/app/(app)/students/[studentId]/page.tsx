
'use client';

import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/provider';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '../student-table';

interface ParentCredential {
  email: string;
  password?: string;
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const studentId = params.studentId;

  const studentRef = useMemoFirebase(() => {
    if (!studentId) return null;
    return doc(db, 'students', studentId);
  }, [studentId]);

  const { data: student, isLoading: studentLoading } = useDoc<Student>(studentRef);

  const parentUserId = student?.parentUserId;

  const credentialRef = useMemoFirebase(() => {
    if (!parentUserId) return null;
    return doc(db, 'parentCredentials', parentUserId);
  }, [parentUserId]); 

  const { data: credential, isLoading: credentialLoading } = useDoc<ParentCredential>(credentialRef);

  const isLoading = studentLoading || (student && student.parentUserId && credentialLoading);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!student) {
    return notFound();
  }

  // A teacher can only view students in their own branch
  if (user?.role === 'teacher' && user.branchId !== student.branchId) {
    return (
        <Alert variant="destructive">
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You do not have permission to view this student's details.</AlertDescription>
        </Alert>
    );
  }

  const canViewCredentials = user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'teacher';

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Detailed information for {student.fullName}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <InfoRow label="Full Name" value={student.fullName} />
              <InfoRow label="Admission Number" value={student.admissionNo} />
              <InfoRow label="Class" value={student.class} />
              <InfoRow label="Branch ID" value={student.branchId} />
              {/* Add more student details here as needed */}
          </CardContent>
      </Card>
      
      {canViewCredentials && (
        <Card>
            <CardHeader>
                <CardTitle>Parent Login Credentials</CardTitle>
                <CardDescription>
                These are the temporary login details for the student's parent. They expire after 30 days.
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
                    <Alert variant="destructive">
                        <AlertTitle>Credentials Expired or Not Found</AlertTitle>
                        <AlertDescription>
                            The temporary credentials for this parent are no longer available. If the parent cannot log in, their password may need to be reset.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    Note: Temporary passwords expire for security reasons.
                 </p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
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
