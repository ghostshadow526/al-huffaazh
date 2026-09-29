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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  KeyRound, 
  UserX, 
  UserCheck, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  AlertDialog, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

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
  emailVerified: 'Email Verified',
  status: 'Status',
  actions: 'Actions',
};

export function UserTable({ data, columns, isLoading }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();
  const firestore = useFirestore();

  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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
        description: `${user.fullName}'s account has been ${status}.`,
      });
      setUserToDisable(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update user status.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!firestore || !currentUser) return;
    const canDelete =
      currentUser.role === 'super_admin' ||
      (currentUser.role === 'branch_admin' &&
        user.role !== 'super_admin' &&
        (!currentUser.branchId || currentUser.branchId === user.branchId));

    if (!canDelete) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to delete this user.',
      });
      return;
    }

    setIsUpdating(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await deleteDoc(userDocRef);
      toast({
        title: 'User Deleted Permanently',
        description: `${user.fullName || user.email}'s account has been permanently removed.`,
      });
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Could not delete user account.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const renderCell = (item: User, column: keyof User | 'actions') => {
    if (column === 'actions') {
      const isSelf = currentUser?.uid === item.uid;
      const canManage =
        currentUser?.role === 'super_admin' ||
        (currentUser?.role === 'branch_admin' && item.role !== 'super_admin');

      if (isSelf || !canManage) {
        return null;
      }

      const canDelete =
        currentUser?.role === 'super_admin' ||
        (currentUser?.role === 'branch_admin' &&
          item.role !== 'super_admin' &&
          (!currentUser.branchId || currentUser.branchId === item.branchId));

      return (
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick Visible Delete Button */}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserToDelete(item)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={`Delete ${item.fullName || 'User'} Permanently`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => item.email && handlePasswordReset(item.email)}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Reset Password</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {item.status === 'active' ? (
                <DropdownMenuItem
                  onClick={() => setUserToDisable(item)}
                  className="text-amber-600 focus:bg-amber-50 focus:text-amber-700"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Disable User</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus(item, 'active')}
                  className="text-green-600 focus:bg-green-50 focus:text-green-700"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span>Enable User</span>
                </DropdownMenuItem>
              )}

              {/* Delete Option */}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setUserToDelete(item)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive font-medium cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete User Permanently</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    const value = item[column as keyof User];
    switch (column) {
      case 'role':
        return (
          <Badge variant="secondary" className="capitalize">
            {String(value || '').replace('_', ' ')}
          </Badge>
        );
      case 'status':
        return (
          <Badge
            variant={value === 'active' ? 'default' : 'destructive'}
            className={value === 'active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
          >
            {String(value || 'active')}
          </Badge>
        );
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col)}
                  className={col === 'actions' ? 'text-right' : ''}
                >
                  {columnHeaders[String(col)] || String(col)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.uid}>
                  {columns.map((col) => (
                    <TableCell key={col}>{renderCell(item, col)}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found in this category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Disable User Confirmation Dialog */}
      <AlertDialog
        open={!!userToDisable}
        onOpenChange={(open) => !open && setUserToDisable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-amber-600" /> Disable User Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Disabling <strong>{userToDisable?.fullName}</strong> ({userToDisable?.email}) will prevent them from logging in and accessing the system until re-enabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => userToDisable && handleUpdateStatus(userToDisable, 'disabled')}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable User
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete User Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Are you sure you want to permanently delete <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email})?
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded border space-y-1">
                  <div><strong>Role:</strong> <span className="capitalize">{userToDelete?.role?.replace('_', ' ')}</span></div>
                  {userToDelete?.branchId && <div><strong>Branch:</strong> {userToDelete?.branchId}</div>}
                  <div className="text-destructive font-medium pt-1">
                    This will delete the user account document from the database and revoke all system access immediately. This action cannot be undone.
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              disabled={isUpdating}
            >
              {isUpdating ? (
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
