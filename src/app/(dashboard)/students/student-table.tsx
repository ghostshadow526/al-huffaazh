

'use client';

import React from 'react';
import Image from 'next/image';
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
import { User as UserIcon, QrCode, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// This interface can be expanded based on the full Student entity
export interface Student {
  id: string;
  fullName: string;
  class: string;
  admissionNo: string;
  branchId: string;
  photoUrl: string;
  qrImageUrl?: string;
  parentUserId?: string;
  parentEmail?: string;
  dob: string; // Make sure dob is part of the interface
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
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  
  const renderCell = (item: Student, column: keyof Student | 'actions') => {
    if (column === 'actions') {
      return (
         <TooltipProvider>
          <div className='flex items-center gap-2'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
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
                    <Button variant="ghost" size="icon" asChild>
                    <a href={item.qrImageUrl} target="_blank" rel="noopener noreferrer" download={`${item.admissionNo}-qrcode.png`}>
                        <QrCode className="h-4 w-4" />
                    </a>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>View & Download QR Code</p>
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
              <TableHead key={String(col)}>{columnHeaders[String(col)] || String(col)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map(item => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={String(col)}>{renderCell(item, col)}</TableCell>
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
