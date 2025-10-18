
'use client';

import React from 'react';
import Image from 'next/image';
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
import { User as UserIcon } from 'lucide-react';


// This interface can be expanded based on the full Student entity
export interface Student {
  id: string;
  fullName: string;
  class: string;
  admissionNo: string;
  branchId: string;
  photoUrl: string;
  // other fields from your Student entity
}

interface StudentTableProps {
  data: Student[];
  columns: (keyof Student)[];
  isLoading: boolean;
}

const columnHeaders: Record<string, string> = {
  photoUrl: 'Photo',
  fullName: 'Full Name',
  class: 'Class',
  admissionNo: 'Admission No.',
  branchId: 'Branch ID',
};


export function StudentTable({ data, columns, isLoading }: StudentTableProps) {
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  
  const renderCell = (item: Student, column: keyof Student) => {
    const value = item[column];
    switch (column) {
      case 'photoUrl':
        return (
            <Avatar>
              <AvatarImage src={String(value)} alt={item.fullName} />
              <AvatarFallback>
                  {item.fullName ? getInitials(item.fullName) : <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
        );
      case 'fullName':
        return <span className="font-medium">{String(value)}</span>
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
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={col}>{renderCell(item, col)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No students found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
