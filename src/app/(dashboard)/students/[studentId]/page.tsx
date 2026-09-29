'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/components/auth-provider';
import type { Student } from '../student-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ParentCredential {
  email: string;
  password?: string;
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [credential, setCredential] = useState<ParentCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

        // Fetch parent credentials if parentUserId exists
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

  const handleDeleteStudent = async () => {
    if (!firestore || !student || !currentUser) return;

    const canDelete =
      currentUser.role === 'super_admin' ||
      (['branch_admin', 'teacher'].includes(currentUser.role || '') &&
        (!currentUser.branchId || currentUser.branchId === student.branchId));

    if (!canDelete) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to delete this student record.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const studentDocRef = doc(firestore, 'students', student.id);
      await deleteDoc(studentDocRef);

      if (student.parentUserId) {
        try {
          const credDocRef = doc(firestore, 'parentCredentials', student.parentUserId);
          await deleteDoc(credDocRef);
        } catch {
          // Non-critical
        }
      }

      toast({
        title: 'Student Record Deleted',
        description: `${student.fullName} (Admission: ${student.admissionNo}) has been deleted permanently.`,
      });
      setIsDeleteDialogOpen(false);
      router.push('/manage-students');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: err.message || 'Could not delete student record.',
      });
    } finally {
      setIsDeleting(false);
    }
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
    return notFound();
  }

  const canDeleteStudent =
    currentUser?.role === 'super_admin' ||
    (['branch_admin', 'teacher'].includes(currentUser?.role || '') &&
      (!currentUser?.branchId || currentUser?.branchId === student.branchId));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
          <Link href="/manage-students">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Link>
        </Button>

        {canDeleteStudent && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Delete Student
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 border-t">
          <InfoRow label="Full Name" value={student.fullName} />
          <InfoRow label="Admission Number" value={student.admissionNo} />
          <InfoRow label="Class" value={student.class} />
          <InfoRow label="Date of Birth" value={student.dob ? format(new Date(student.dob), 'MMMM d, yyyy') : 'N/A'} />
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
                {student.parentUserId ? 
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

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Student Record Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Are you sure you want to permanently delete student{' '}
                  <strong>{student.fullName}</strong> (Admission: <strong>{student.admissionNo}</strong>)?
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded border space-y-1">
                  <div><strong>Class:</strong> {student.class}</div>
                  <div><strong>Branch:</strong> {student.branchId}</div>
                  {student.parentEmail && <div><strong>Parent Email:</strong> {student.parentEmail}</div>}
                  <div className="text-destructive font-medium pt-1">
                    This will remove the student from class registers, attendance records, and academy database entries. This action cannot be undone.
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            <div className="space-y-2">
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
  );
}
