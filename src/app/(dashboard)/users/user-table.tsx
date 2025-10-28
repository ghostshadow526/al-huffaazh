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
import { User } from '@/components/auth-provider';

interface UserTableProps {
  data: User[];
  columns: (keyof User)[];
  isLoading: boolean;
}

const columnHeaders: Record<keyof User, string> = {
  uid: 'User ID',
  fullName: 'Full Name',
  email: 'Email',
  role: 'Role',
  branchId: 'Branch ID',
  photoURL: 'Photo',
  emailVerified: "Email Verified"
};


export function UserTable({ data, columns, isLoading }: UserTableProps) {
  const renderCell = (item: User, column: keyof User) => {
    const value = item[column];
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
              <TableHead key={col}>{columnHeaders[col] || col}</TableHead>
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
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
