
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

interface PaymentRecord {
    id: string;
    studentName: string;
    amount: number;
    paymentReason: string;
    otherReason?: string;
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: any;
    receiptUrl: string;
    parentUserId: string;
    branchId: string;
}

export default function AdminPayments() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const paymentsQuery = useMemoFirebase(() => {
        if (!user || !user.uid) return null;
        let q = query(collection(firestore, 'payments'), orderBy('createdAt', 'desc'));
        if (user.role === 'branch_admin' && user.branchId) {
            q = query(q, where('branchId', '==', user.branchId));
        }
        return q;
    }, [firestore, user?.uid, user?.role, user?.branchId]);

    const { data: payments, isLoading } = useCollection<PaymentRecord>(paymentsQuery);

    const handleConfirm = async (payment: PaymentRecord) => {
        if (!firestore || !user) return;
        setProcessingId(payment.id);
        try {
            const batch = writeBatch(firestore);
            const paymentRef = doc(firestore, 'payments', payment.id);
            batch.update(paymentRef, {
                status: 'confirmed',
                confirmedBy: user.uid,
                confirmedAt: serverTimestamp(),
            });

            const notificationRef = doc(collection(firestore, 'notifications'));
            batch.set(notificationRef, {
                userId: payment.parentUserId,
                message: `Your payment of ₦${payment.amount.toLocaleString()} for ${payment.studentName} has been confirmed.`,
                link: '/payments',
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            toast({ title: 'Payment Confirmed', description: 'The payment has been marked as paid.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectionDialog = (payment: PaymentRecord) => {
        setSelectedPayment(payment);
        setRejectionModalOpen(true);
    };

    const handleReject = async () => {
        if (!firestore || !user || !selectedPayment || !rejectionReason) return;
        setProcessingId(selectedPayment.id);
        setRejectionModalOpen(false);

        try {
            const batch = writeBatch(firestore);
            const paymentRef = doc(firestore, 'payments', selectedPayment.id);
            batch.update(paymentRef, {
                status: 'rejected',
                rejectionReason: rejectionReason,
            });

            const notificationRef = doc(collection(firestore, 'notifications'));
            batch.set(notificationRef, {
                userId: selectedPayment.parentUserId,
                message: `Your payment of ₦${selectedPayment.amount.toLocaleString()} was rejected. Reason: ${rejectionReason}`,
                link: '/payments',
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            toast({ title: 'Payment Rejected', description: 'The parent has been notified.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
            setRejectionReason('');
            setSelectedPayment(null);
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
                    <CardTitle>Manage Payments</CardTitle>
                    <CardDescription>Review, confirm, or reject fee payments submitted by parents.</CardDescription>
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
                            ) : payments && payments.length > 0 ? (
                                payments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.studentName}</TableCell>
                                        <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                                        <TableCell className="capitalize">{p.paymentReason.replace('_', ' ')}</TableCell>
                                        <TableCell>{format(p.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(p.status)} className="capitalize">{p.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">View</a>
                                        </TableCell>
                                        <TableCell>
                                            {p.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => handleConfirm(p)} disabled={processingId === p.id} className="bg-green-500 hover:bg-green-600">
                                                        {processingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4"/>}
                                                        <span className='ml-2 hidden sm:inline'>Confirm</span>
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => openRejectionDialog(p)} disabled={processingId === p.id}>
                                                         {processingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4"/>}
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
                                    <TableCell colSpan={7} className="h-24 text-center">No payment submissions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment?</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this payment. The parent will be notified.
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
