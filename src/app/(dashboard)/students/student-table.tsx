'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, QrCode, Eye, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/components/auth-provider';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export interface Student {
  id: string;
  fullName: string;
  class: string;
  admissionNo: string;
  branchId: string;
  photoUrl: string;
  originalPhotoUrl?: string;
  qrImageUrl?: string;
  parentUserId?: string;
  parentEmail?: string;
  dob: string;
  address: string;
  gender: string;
}

interface StudentTableProps {
  data: Student[];
  columns: (keyof Student | 'actions')[];
  isLoading: boolean;
}

const columnHeaders: Record<string, string> = {
  photoUrl: 'Photo',
  fullName: 'Full Name',
  class: 'Class',
  admissionNo: 'Admission No.',
  parentEmail: "Parent's Email",
  branchId: 'Branch ID',
  actions: 'Actions',
};

export function StudentTable({ data, columns, isLoading }: StudentTableProps) {
  const { user: currentUser } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!firestore || !currentUser) return;

    const canDelete =
      currentUser.role === 'super_admin' ||
      (currentUser.role === 'branch_admin' &&
        (!currentUser.branchId || currentUser.branchId === student.branchId));

    if (!canDelete) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to delete this student.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const studentDocRef = doc(firestore, 'students', student.id);
      await deleteDoc(studentDocRef);

      // Also clean up parent credentials doc if available
      if (student.parentUserId) {
        try {
          const credDocRef = doc(firestore, 'parentCredentials', student.parentUserId);
          await deleteDoc(credDocRef);
        } catch {
          // Non-critical if parent credentials doc doesn't exist
        }
      }

      toast({
        title: 'Student Record Deleted',
        description: `${student.fullName} (Admission: ${student.admissionNo}) has been deleted permanently.`,
      });
      setStudentToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Could not delete student record.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCell = (item: Student, column: keyof Student | 'actions') => {
    if (column === 'actions') {
      const canDelete =
        currentUser?.role === 'super_admin' ||
        (currentUser?.role === 'branch_admin' &&
          (!currentUser?.branchId || currentUser?.branchId === item.branchId));

      return (
        <TooltipProvider>
          <div className="flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <Link href={`/students/${item.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Student Info</p>
              </TooltipContent>
            </Tooltip>

            {item.qrImageUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <a
                      href={item.qrImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${item.admissionNo}-qrcode.png`}
                    >
                      <QrCode className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View & Download QR Code</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Delete Student Action */}
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStudentToDelete(item)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Student Permanently</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      );
    }

    const value = item[column as keyof Student];

    switch (column) {
      case 'photoUrl':
        const fullQualityUrl = item.originalPhotoUrl || String(value).split('?tr=')[0];
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={fullQualityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-zoom-in block"
                >
                  <Avatar className="hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={String(value)} alt={item.fullName} />
                    <AvatarFallback>
                      {item.fullName ? getInitials(item.fullName) : <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to retrieve original full quality photo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'fullName':
        return <span className="font-medium">{String(value)}</span>;
      default:
        return String(value ?? '');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-xl border-2 border-border shadow-xs">
        <Table className="min-w-[680px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col)}
                  className={`font-bold text-foreground py-3.5 ${
                    col === 'actions' ? 'text-right' : ''
                  }`}
                >
                  {columnHeaders[String(col)] || String(col)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  {columns.map((col) => (
                    <TableCell key={String(col)} className="py-3">
                      {renderCell(item, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  No students found in this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Student Record Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Are you sure you want to permanently delete student{' '}
                  <strong>{studentToDelete?.fullName}</strong> (Admission No:{' '}
                  <strong>{studentToDelete?.admissionNo}</strong>)?
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded border space-y-1">
                  <div>
                    <strong>Class:</strong> {studentToDelete?.class}
                  </div>
                  <div>
                    <strong>Branch:</strong> {studentToDelete?.branchId}
                  </div>
                  {studentToDelete?.parentEmail && (
                    <div>
                      <strong>Parent Email:</strong> {studentToDelete?.parentEmail}
                    </div>
                  )}
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
              onClick={() => studentToDelete && handleDeleteStudent(studentToDelete)}
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
    </>
  );
}
