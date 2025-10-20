
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
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
  const { toast } = useToast();

  const [filter, setFilter] = useState<'pending' | 'confirmed' | 'rejected' | 'all'>('pending');
  
  // By setting transactions to an empty array and isLoading to false, we prevent any Firestore calls.
  const transactions: Transaction[] = [];
  const isLoading = false;


  const handleConfirm = async (transaction: Transaction) => {
    // This function is now disabled.
    toast({ title: 'Functionality Disabled', description: 'This feature is currently not connected to the database.' });
  };

  const openRejectDialog = (transaction: Transaction) => {
     // This function is now disabled.
    toast({ title: 'Functionality Disabled', description: 'This feature is currently not connected to the database.' });
  };

  const handleReject = async () => {
    // This function is now disabled.
    toast({ title: 'Functionality Disabled', description: 'This feature is currently not connected to the database.' });
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
                  <TableCell colSpan={6} className="h-24 text-center">No transaction submissions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog>
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
              placeholder="e.g., Receipt is unclear, amount does not match..."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Submit Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
