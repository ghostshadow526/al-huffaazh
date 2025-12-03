
'use client';

import React from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';


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
  actions: "Actions"
};


export function UserTable({ data, columns, isLoading }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const auth = getAuth();

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

  const renderCell = (item: User, column: keyof User | 'actions') => {
    if (column === 'actions') {
      const isSelf = currentUser?.uid === item.uid;
      return (
        <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSelf}>
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePasswordReset(item.email!)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Reset Password</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    }

    const value = item[column as keyof User];
    switch (column) {
      case 'role':
        return <Badge variant="secondary" className="capitalize">{String(value).replace('_', ' ')}</Badge>;
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
  );
}
