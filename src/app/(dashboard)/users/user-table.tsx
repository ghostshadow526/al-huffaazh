

'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth, User } from '@/components/auth-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, KeyRound, UserX, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface UserTableProps {
  data: User[];
  columns: (keyof User | 'actions')[];
  isLoading: boolean;
}

const columnHeaders: Record<string, string> = {
  uid: 'User ID',
  fullName: 'Full Name',
  email: 'Email',
  role: 'Role',
  branchId: 'Branch ID',
  photoURL: 'Photo',
  emailVerified: "Email Verified",
  status: 'Status',
  actions: "Actions"
};


export function UserTable({ data, columns, isLoading }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  const firestore = useFirestore();
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Success',
        description: `Password reset link sent to ${email}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
      });
    }
  };

  const handleUpdateStatus = async (user: User, status: 'active' | 'disabled') => {
      if (!firestore) return;
      setIsUpdating(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      try {
          await updateDoc(userDocRef, { status: status });
          toast({
              title: 'Success',
              description: `${user.fullName}'s account has been ${status}.`
          });
          setUserToUpdate(null);
      } catch (error: any) {
           toast({
              variant: 'destructive',
              title: 'Update Failed',
              description: error.message || 'Could not update user status.'
          });
      } finally {
          setIsUpdating(false);
      }
  };


  const renderCell = (item: User, column: keyof User | 'actions') => {
    if (column === 'actions') {
      const isSelf = currentUser?.uid === item.uid;
      const canManage = currentUser?.role === 'super_admin' || (currentUser?.role === 'branch_admin' && item.role !== 'super_admin');

      if (isSelf || !canManage) {
        return null;
      }

      return (
        <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePasswordReset(item.email!)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Reset Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {item.status === 'active' ? (
                     <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <UserX className="mr-2 h-4 w-4"/>
                            <span>Disable User</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                ) : (
                    <DropdownMenuItem onClick={() => handleUpdateStatus(item, 'active')} className="text-green-600 focus:bg-green-100 focus:text-green-700">
                        <UserCheck className="mr-2 h-4 w-4"/>
                        <span>Enable User</span>
                    </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Disabling this user will prevent them from logging in and accessing the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button variant="destructive" onClick={() => handleUpdateStatus(item, 'disabled')} disabled={isUpdating}>
                            {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                            Disable User
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </div>
      );
    }

    const value = item[column as keyof User];
    switch (column) {
      case 'role':
        return <Badge variant="secondary" className="capitalize">{String(value).replace('_', ' ')}</Badge>;
       case 'status':
            return <Badge variant={value === 'active' ? 'default' : 'destructive'} className={value === 'active' ? 'bg-green-100 text-green-800' : ''}>{String(value)}</Badge>
      default:
        return String(value ?? '');
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <AlertDialog>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                {columns.map(col => (
                <TableHead key={String(col)} className={col === 'actions' ? 'text-right' : ''}>{columnHeaders[String(col)] || String(col)}</TableHead>
                ))}
            </TableRow>
            </TableHeader>
            <TableBody>
            {data.length > 0 ? (
                data.map(item => (
                <TableRow key={item.uid}>
                    {columns.map(col => (
                    <TableCell key={col}>{renderCell(item, col)}</TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No users found in this category.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
    </AlertDialog>
  );
}
