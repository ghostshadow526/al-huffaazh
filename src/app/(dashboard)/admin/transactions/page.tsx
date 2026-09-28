'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, Loader2, ShieldAlert, Eye, Receipt as ReceiptIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Receipt {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
  parentUserId?: string;
  branchId: string;
  amount: number;
  reason: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: { seconds: number; nanoseconds: number };
  uploadedBy?: string;
  uploadedByRole?: string;
  paymentMethod?: string;
  referenceNo?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  rejectionReason?: string;
}

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const receiptsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    // STRICT SECURITY: Only super_admin can query all transactions across branches
    if (user.role === 'super_admin') {
      return collection(firestore, 'receipts');
    }
    
    return null;
  }, [user, firestore]);
  
  const { data: allReceipts, isLoading } = useCollection<Receipt>(receiptsQuery);

  const filteredReceipts = React.useMemo(() => {
    if (!allReceipts) return [];
    if (filter === 'all') return allReceipts;
    return allReceipts.filter(t => t.status === filter);
  }, [allReceipts, filter]);

  const handleApprove = (receipt: Receipt) => {
    if (!firestore || !user) return;
    setIsProcessing(true);

    const receiptDocRef = doc(firestore, 'receipts', receipt.id);
    
    const approvalUpdate = {
      status: 'approved' as const,
      verifiedBy: user.uid,
      verifiedByName: user.fullName || 'Super Admin',
    };

    updateDoc(receiptDocRef, approvalUpdate).then(() => {
      toast({ title: 'Receipt Approved', description: `Payment for ${receipt.studentName} has been approved.` });
    }).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: receiptDocRef.path,
        operation: 'update',
        requestResourceData: approvalUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const openRejectDialog = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!firestore || !selectedReceipt || !rejectionReason.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide a reason for rejection.' });
      return;
    }
    if (!user) return;
    setIsProcessing(true);

    const receiptDocRef = doc(firestore, 'receipts', selectedReceipt.id);

    const rejectionUpdate = {
      status: 'rejected' as const,
      rejectionReason: rejectionReason,
      verifiedBy: user.uid,
      verifiedByName: user.fullName || 'Super Admin',
    };
    
    updateDoc(receiptDocRef, rejectionUpdate).then(() => {
      toast({ title: 'Receipt Rejected', description: `Payment for ${selectedReceipt.studentName} marked as rejected.` });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedReceipt(null);
    }).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: receiptDocRef.path,
        operation: 'update',
        requestResourceData: rejectionUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    }
  };

  // Strictly only super_admin can access All Transactions
  if (user && user.role !== 'super_admin') {
    return (
      <Card className="max-w-2xl mx-auto my-12 border-destructive/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Super Admin Access Only</CardTitle>
          <CardDescription className="text-base mt-2">
            Viewing and managing all transactions is restricted to the Super Administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Branch administrators and other accounts do not have permission to view transactions across the academy.
          </p>
          <Button asChild variant="outline">
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <ReceiptIcon className="h-6 w-6 text-primary" /> All Transactions & Fee Receipts
            </CardTitle>
            <CardDescription className="mt-1">
              Review, approve, or reject payment receipts submitted by Bursars and Parents across all branches.
            </CardDescription>
          </div>
          <Badge variant="outline" className="self-start sm:self-center font-mono text-xs px-3 py-1">
            Super Admin Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid grid-cols-4 max-w-md mb-6">
            <TabsTrigger value="pending">
              Pending {allReceipts ? `(${allReceipts.filter(r => r.status === 'pending').length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved {allReceipts ? `(${allReceipts.filter(r => r.status === 'approved').length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected {allReceipts ? `(${allReceipts.filter(r => r.status === 'rejected').length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="all">
              All {allReceipts ? `(${allReceipts.length})` : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Purpose</TableHead>
                <TableHead>Source / Method</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReceipts && filteredReceipts.length > 0 ? (
                filteredReceipts.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-foreground">{t.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.admissionNo ? `Adm: ${t.admissionNo}` : ''} {t.branchId ? `• ${t.branchId}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700 whitespace-nowrap">
                      ₦{(t.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{t.reason}</div>
                      {t.referenceNo && (
                        <div className="text-xs text-muted-foreground font-mono">Ref: {t.referenceNo}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.uploadedByRole === 'burser' ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          Bursar {t.uploadedBy ? `(${t.uploadedBy})` : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Parent Submission
                        </Badge>
                      )}
                      {t.paymentMethod && (
                        <div className="text-xs text-muted-foreground mt-0.5">{t.paymentMethod}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {t.uploadedAt?.seconds ? formatDistanceToNow(new Date(t.uploadedAt.seconds * 1000), { addSuffix: true }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(t.status)}
                        {t.status === 'rejected' && t.rejectionReason && (
                          <p className="text-xs text-destructive italic max-w-[150px] truncate" title={t.rejectionReason}>
                            Reason: {t.rejectionReason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex gap-2 justify-end items-center">
                        {t.fileUrl ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPreviewReceipt(t)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Receipt
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No receipt file</span>
                        )}

                        {t.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(t)} 
                              className="bg-green-600 hover:bg-green-700 text-white text-xs" 
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => openRejectDialog(t)} 
                              disabled={isProcessing}
                              className="text-xs"
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No transactions found for this category.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Reject Payment Receipt
            </DialogTitle>
            <DialogDescription>
              Provide the specific reason for rejecting the receipt for <strong>{selectedReceipt?.studentName}</strong> (₦{selectedReceipt?.amount?.toLocaleString()}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="rejection-reason" className="text-sm font-medium mb-1.5 block">
              Rejection Reason
            </Label>
            <Textarea 
              id="rejection-reason"
              placeholder="e.g. Receipt image blurry, payment reference does not reflect in academy bank account, amount does not match fee schedule..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal Preview */}
      <Dialog open={!!previewReceipt} onOpenChange={(open) => !open && setPreviewReceipt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-primary" /> Receipt Details: {previewReceipt?.studentName}
            </DialogTitle>
            <DialogDescription>
              Amount: ₦{previewReceipt?.amount?.toLocaleString()} • Purpose: {previewReceipt?.reason}
            </DialogDescription>
          </DialogHeader>
          {previewReceipt?.fileUrl && (
            <div className="space-y-4 my-2">
              <div className="relative w-full h-[400px] border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
                {previewReceipt.fileUrl.endsWith('.pdf') ? (
                  <iframe 
                    src={previewReceipt.fileUrl} 
                    className="w-full h-full" 
                    title="Receipt PDF" 
                  />
                ) : (
                  <img 
                    src={previewReceipt.fileUrl} 
                    alt="Receipt Image" 
                    className="object-contain w-full h-full"
                  />
                )}
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Branch: {previewReceipt.branchId || 'Not specified'}</span>
                <Button asChild variant="outline" size="sm">
                  <a href={previewReceipt.fileUrl} target="_blank" rel="noopener noreferrer">
                    Open Original in New Tab
                  </a>
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewReceipt(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
