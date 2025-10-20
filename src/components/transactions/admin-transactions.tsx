
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, doc, writeBatch, serverTimestamp, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';

interface TransactionRecord {
    id: string;
    studentName: string;
    amount: number;
    reason: string;
    otherReason?: string;
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: any;
    receiptUrl: string;
    parentUserId: string;
    branchId: string;
}

export default function AdminTransactions() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !user.uid) return null;
        let q = query(collection(firestore, 'transactions'), orderBy('createdAt', 'desc'));
        if (user.role === 'branch_admin' && user.branchId) {
            q = query(q, where('branchId', '==', user.branchId));
        }
        return q;
    }, [firestore, user?.uid, user?.role, user?.branchId]);

    const { data: transactions, isLoading } = useCollection<TransactionRecord>(transactionsQuery);

    const handleConfirm = async (transaction: TransactionRecord) => {
        if (!firestore || !user) return;
        setProcessingId(transaction.id);
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
                message: `Your transaction of ₦${transaction.amount.toLocaleString()} for ${transaction.studentName} has been confirmed.`,
                link: '/transactions',
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            toast({ title: 'Transaction Confirmed', description: 'The transaction has been marked as paid.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectionDialog = (transaction: TransactionRecord) => {
        setSelectedTransaction(transaction);
        setRejectionModalOpen(true);
    };

    const handleReject = async () => {
        if (!firestore || !user || !selectedTransaction || !rejectionReason) return;
        setProcessingId(selectedTransaction.id);
        setRejectionModalOpen(false);

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
                message: `Your transaction of ₦${selectedTransaction.amount.toLocaleString()} was rejected. Reason: ${rejectionReason}`,
                link: '/transactions',
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            toast({ title: 'Transaction Rejected', description: 'The parent has been notified.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
            setRejectionReason('');
            setSelectedTransaction(null);
        }
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
        case 'confirmed': return 'default';
        case 'pending': return 'secondary';
        case 'rejected': return 'destructive';
        default: return 'outline';
      }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Transactions</CardTitle>
                    <CardDescription>Review, confirm, or reject fee transactions submitted by parents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Receipt</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : transactions && transactions.length > 0 ? (
                                transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.studentName}</TableCell>
                                        <TableCell>₦{t.amount.toLocaleString()}</TableCell>
                                        <TableCell className="capitalize">{t.reason.replace('_', ' ')}</TableCell>
                                        <TableCell>{format(t.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(t.status)} className="capitalize">{t.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">View</a>
                                        </TableCell>
                                        <TableCell>
                                            {t.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleConfirm(t)} disabled={processingId === t.id} className="bg-green-500 hover:bg-green-600">
                                                        {processingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4"/>}
                                                        <span className='ml-2 hidden sm:inline'>Confirm</span>
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => openRejectionDialog(t)} disabled={processingId === t.id}>
                                                         {processingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4"/>}
                                                        <span className='ml-2 hidden sm:inline'>Reject</span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Processed</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No transaction submissions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Transaction?</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this transaction. The parent will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g., Receipt is unclear, amount does not match..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRejectionModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || !!processingId}>
                            {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
