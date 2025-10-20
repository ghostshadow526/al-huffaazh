
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  parentUserId: string;
  branchId: string;
  amount: number;
  reason: string;
  receiptUrl: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: { seconds: number; nanoseconds: number };
  confirmedBy?: string;
  confirmedAt?: { seconds: number; nanoseconds: number };
  rejectionReason?: string;
}

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [filter, setFilter] = useState<'pending' | 'confirmed' | 'rejected' | 'all'>('pending');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NOTE: This query is disabled to prevent permission errors without security rules.
  const transactionsQuery = null;
  
  const { data: allTransactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const filteredTransactions = React.useMemo(() => {
    if (!allTransactions) return [];
    if (filter === 'all') return allTransactions;
    return allTransactions.filter(t => t.status === filter);
  }, [allTransactions, filter]);


  const handleConfirm = async (transaction: Transaction) => {
    if (!firestore || !user) return;
    setIsProcessing(true);

    const transactionDocRef = doc(firestore, 'transactions', transaction.id);
    const notificationDocRef = doc(collection(firestore, 'notifications'));
    
    const batch = writeBatch(firestore);

    batch.update(transactionDocRef, {
        status: 'confirmed',
        confirmedBy: user.uid,
        confirmedAt: new Date(),
    });

    batch.set(notificationDocRef, {
        userId: transaction.parentUserId,
        message: `Your payment of ₦${transaction.amount.toLocaleString()} for ${transaction.studentName} has been confirmed.`,
        link: `/transactions`,
        read: false,
        createdAt: new Date(),
    });

    try {
        await batch.commit();
        toast({ title: 'Transaction Confirmed', description: 'The parent has been notified.'});
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const openRejectDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!firestore || !selectedTransaction || !rejectionReason.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please provide a reason for rejection.' });
        return;
    };
    setIsProcessing(true);

    const transactionDocRef = doc(firestore, 'transactions', selectedTransaction.id);
    const notificationDocRef = doc(collection(firestore, 'notifications'));

    const batch = writeBatch(firestore);

    batch.update(transactionDocRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
    });
    
    batch.set(notificationDocRef, {
        userId: selectedTransaction.parentUserId,
        message: `Your payment for ${selectedTransaction.studentName} was rejected. Reason: ${rejectionReason}`,
        link: `/transactions`,
        read: false,
        createdAt: new Date(),
    });

    try {
        await batch.commit();
        toast({ title: 'Transaction Rejected', description: 'The parent has been notified.' });
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedTransaction(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Transactions</CardTitle>
        <CardDescription>Review and approve or reject payment submissions from parents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount (₦)</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.studentName}</div>
                      <div className="text-sm text-muted-foreground">{t.branchId}</div>
                    </TableCell>
                    <TableCell>{t.amount.toLocaleString()}</TableCell>
                    <TableCell>{t.reason}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(t.createdAt.seconds * 1000), { addSuffix: true })}</TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button asChild variant="outline" size="sm">
                                <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a>
                            </Button>
                            {t.status === 'pending' && (
                                <>
                                    {user?.role === 'super_admin' && (
                                      <Button size="sm" onClick={() => handleConfirm(t)} className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Confirm
                                      </Button>
                                    )}
                                    <Button size="sm" variant="destructive" onClick={() => openRejectDialog(t)} disabled={isProcessing}>Reject</Button>
                                </>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No transaction submissions found. This may be due to missing database permissions.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transaction. This will be sent to the parent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason" className="sr-only">Rejection Reason</Label>
            <Textarea 
              id="rejection-reason"
              placeholder="e.g., Receipt is unclear, amount does not match..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
