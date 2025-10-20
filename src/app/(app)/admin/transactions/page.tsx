
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, updateDoc } from 'firebase/firestore';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Receipt {
  id: string;
  studentId: string;
  studentName: string;
  parentUserId: string;
  branchId: string;
  amount: number;
  reason: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: { seconds: number; nanoseconds: number };
  verifiedBy?: string;
  rejectionReason?: string;
}

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const receiptsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    if (user.role === 'super_admin') {
      return collection(firestore, 'receipts');
    }
    if (user.role === 'branch_admin' && user.branchId) {
      return query(collection(firestore, 'receipts'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user, firestore]);
  
  const { data: allReceipts, isLoading } = useCollection<Receipt>(receiptsQuery);

  const filteredReceipts = React.useMemo(() => {
    if (!allReceipts) return [];
    if (filter === 'all') return allReceipts;
    return allReceipts.filter(t => t.status === filter);
  }, [allReceipts, filter]);


  const handleApprove = async (receipt: Receipt) => {
    if (!firestore || !user) return;
    setIsProcessing(true);

    const receiptDocRef = doc(firestore, 'receipts', receipt.id);
    const notificationDocRef = doc(collection(firestore, 'notifications'));
    
    const batch = writeBatch(firestore);

    batch.update(receiptDocRef, {
        status: 'approved',
        verifiedBy: user.uid,
    });

    batch.set(notificationDocRef, {
        userId: receipt.parentUserId,
        message: `Your payment of ₦${receipt.amount.toLocaleString()} for ${receipt.studentName} has been approved.`,
        link: `/transactions`,
        read: false,
        createdAt: new Date(),
    });

    try {
        await batch.commit();
        toast({ title: 'Receipt Approved', description: 'The parent has been notified.'});
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const openRejectDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!firestore || !selectedReceipt || !rejectionReason.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please provide a reason for rejection.' });
        return;
    };
    setIsProcessing(true);

    const receiptDocRef = doc(firestore, 'receipts', selectedReceipt.id);
    const notificationDocRef = doc(collection(firestore, 'notifications'));

    const batch = writeBatch(firestore);

    batch.update(receiptDocRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        verifiedBy: user?.uid,
    });
    
    batch.set(notificationDocRef, {
        userId: selectedReceipt.parentUserId,
        message: `Your payment for ${selectedReceipt.studentName} was rejected. Reason: ${rejectionReason}`,
        link: `/transactions`,
        read: false,
        createdAt: new Date(),
    });

    try {
        await batch.commit();
        toast({ title: 'Receipt Rejected', description: 'The parent has been notified.' });
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedReceipt(null);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Receipts</CardTitle>
        <CardDescription>Review and approve or reject payment receipts from parents.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
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
              ) : filteredReceipts && filteredReceipts.length > 0 ? (
                filteredReceipts.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.studentName}</div>
                      <div className="text-sm text-muted-foreground">{t.branchId}</div>
                    </TableCell>
                    <TableCell>{t.amount.toLocaleString()}</TableCell>
                    <TableCell>{t.reason}</TableCell>
                    <TableCell>{t.uploadedAt ? formatDistanceToNow(new Date(t.uploadedAt.seconds * 1000), { addSuffix: true }) : 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button asChild variant="outline" size="sm">
                                <a href={t.fileUrl} target="_blank" rel="noopener noreferrer">View Receipt</a>
                            </Button>
                            {t.status === 'pending' && user?.role === 'super_admin' && (
                                <>
                                  <Button size="sm" onClick={() => handleApprove(t)} className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => openRejectDialog(t)} disabled={isProcessing}>Reject</Button>
                                </>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No receipts found for this filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Receipt</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this receipt. This will be sent to the parent.
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

    