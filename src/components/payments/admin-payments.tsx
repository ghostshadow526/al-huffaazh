
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PaymentRecord {
    id: string;
    studentName: string;
    parentUserId: string;
    branchId: string;
    amount: number;
    paymentReason: string;
    otherReason?: string;
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: any;
    receiptUrl: string;
}

export default function AdminPayments() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    let q = query(collection(firestore, 'payments'), orderBy('createdAt', 'desc'));

    if (user.role === 'branch_admin' && user.branchId) {
      q = query(q, where('branchId', '==', user.branchId));
    } else if (user.role !== 'super_admin') {
      return null; // Should not happen based on page logic, but for safety
    }
    
    return q;
  }, [firestore, user]);

  const { data: payments, isLoading: paymentsLoading } = useCollection<PaymentRecord>(paymentsQuery);

  const handlePaymentStatusChange = async (payment: PaymentRecord, newStatus: 'confirmed' | 'rejected', reason?: string) => {
    if (!firestore || !user) return;
    
    const paymentRef = doc(firestore, 'payments', payment.id);
    const notificationRef = doc(collection(firestore, 'notifications'));
    const batch = writeBatch(firestore);

    const updateData: any = {
      status: newStatus,
      confirmedBy: user.uid,
      confirmedAt: serverTimestamp(),
    };
    
    let notifMessage = '';
    if (newStatus === 'confirmed') {
      notifMessage = `Your payment of $${payment.amount} for ${payment.studentName} has been confirmed.`;
    } else if (newStatus === 'rejected') {
      updateData.rejectionReason = reason;
      notifMessage = `Your payment of $${payment.amount} was rejected. Reason: ${reason}`;
    }

    batch.update(paymentRef, updateData);
    
    batch.set(notificationRef, {
      userId: payment.parentUserId,
      message: notifMessage,
      link: '/payments',
      read: false,
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      toast({
        title: `Payment ${newStatus}`,
        description: `The payment for ${payment.studentName} has been updated.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
    setRejectionReason('');
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Payments</CardTitle>
        <CardDescription>Review and manage all submitted fee payments.</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentsLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments && payments.length > 0 ? (
              payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.studentName}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">
                      {payment.paymentReason.replace('_', ' ')}
                      {payment.paymentReason === 'other' && `: ${payment.otherReason}`}
                  </TableCell>
                  <TableCell>{format(payment.createdAt.toDate(), 'PPp')}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(payment.status)} className="capitalize">{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.role !== 'super_admin'}>
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="w-full">View Receipt</a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePaymentStatusChange(payment, 'confirmed')}
                                disabled={payment.status !== 'pending'}
                              >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Confirm
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={payment.status !== 'pending'}
                                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                </DropdownMenuItem>
                               </AlertDialogTrigger>
                          </DropdownMenuContent>
                      </DropdownMenu>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Reject Payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Please provide a reason for rejecting this payment. This will be sent to the parent.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="rejection-reason" className="text-right">Reason</Label>
                                  <Input 
                                    id="rejection-reason" 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g., Unclear receipt image"
                                />
                              </div>
                          </div>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handlePaymentStatusChange(payment, 'rejected', rejectionReason)}
                                disabled={!rejectionReason}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                  Confirm Rejection
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No payments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

    