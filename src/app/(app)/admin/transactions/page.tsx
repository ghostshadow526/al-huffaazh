
'use client';

import React, { useState } from 'react';
import { collection, query, where, orderBy, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const transactionsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;

    let q = query(collection(firestore, 'transactions'), orderBy('createdAt', 'desc'));

    if (user.role === 'branch_admin' && user.branchId) {
      q = query(q, where('branchId', '==', user.branchId));
    }

    if (filter !== 'all') {
      q = query(q, where('status', '==', filter));
    }

    return q;
  }, [user?.uid, user?.role, user?.branchId, firestore, filter]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const handleConfirm = async (transaction: Transaction) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);

      const transactionRef = doc(firestore, 'transactions', transaction.id);
      batch.update(transactionRef, {
        status: 'confirmed',
        confirmedBy: user.uid,
        confirmedAt: serverTimestamp(),
      });

      const notificationRef = doc(collection(firestore, 'notifications'));
      batch.set(notificationRef, {
        userId: transaction.parentUserId,
        message: `Your payment of ₦${transaction.amount.toLocaleString()} for ${transaction.studentName} has been confirmed.`,
        link: `/transactions`,
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      toast({
        title: 'Transaction Confirmed',
        description: `Payment for ${transaction.studentName} has been marked as confirmed.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Failed',
        description: error.message,
      });
    }
  };

  const openRejectDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsRejecting(true);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!firestore || !user || !selectedTransaction || !rejectionReason.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Rejection reason cannot be empty.' });
      return;
    }
    try {
        const batch = writeBatch(firestore);
        
        const transactionRef = doc(firestore, 'transactions', selectedTransaction.id);
        batch.update(transactionRef, {
            status: 'rejected',
            rejectionReason: rejectionReason,
        });

        const notificationRef = doc(collection(firestore, 'notifications'));
        batch.set(notificationRef, {
            userId: selectedTransaction.parentUserId,
            message: `Your payment for ${selectedTransaction.studentName} was rejected. Reason: ${rejectionReason}`,
            link: `/transactions`,
            read: false,
            createdAt: serverTimestamp(),
        });

        await batch.commit();

        toast({
            title: 'Transaction Rejected',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Rejection Failed',
            description: error.message,
        });
    } finally {
        setIsRejecting(false);
        setSelectedTransaction(null);
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
              ) : transactions && transactions.length > 0 ? (
                transactions.map((t) => (
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
                                    <Button size="sm" onClick={() => handleConfirm(t)} className="bg-green-600 hover:bg-green-700">Confirm</Button>
                                    <Button size="sm" variant="destructive" onClick={() => openRejectDialog(t)}>Reject</Button>
                                </>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No transactions found for this filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transaction. This will be sent to the parent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea 
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Receipt is unclear, amount does not match..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
