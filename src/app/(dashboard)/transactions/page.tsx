
'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IKContext, IKUpload } from 'imagekitio-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Banknote, UploadCloud, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Student } from '../students/student-table';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const receiptSchema = z.object({
  studentId: z.string().min(1, 'Please select a child.'),
  amount: z.coerce.number().positive('Please enter a valid amount.'),
  reason: z.string().min(3, 'Please provide a reason for the payment.'),
  fileUrl: z.string().url('Please upload a receipt image.'),
});

interface Receipt {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  reason: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: { seconds: number; nanoseconds: number };
  rejectionReason?: string;
}

const imageKitAuthenticator = async () => {
  const response = await fetch('/api/imagekit/auth');
  const result = await response.json();
  return result;
};

const bankAccounts = [
    { number: '2036300745', branch: 'Kauro and Marwa' },
    { number: '2036316098', branch: 'Nye, Kogi State' },
    { number: '2036316115', branch: 'Ogbomosho Hamama' },
    { number: '2036316328', branch: 'Katchia, Kaduna' },
    { number: '2036316373', branch: 'Jos (2 branches)' },
    { number: '2036316407', branch: 'Saminaka' },
    { number: '2036316414', branch: 'Saki' },
    { number: '2036316445', branch: 'Gambari' },
    { number: '2036316490', branch: 'Kayarda' },
    { number: '2036323197', branch: 'Mariri Dokan Lere, Lere & AL-ASHED' },
];


export default function ParentTransactionsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = useRef<any>(null);

  const childrenQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
  }, [user, firestore]);
  const { data: children, isLoading: childrenLoading } = useCollection<Student>(childrenQuery);

  const receiptsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'receipts'), where('parentUserId', '==', user.uid));
  }, [user, firestore]);
  const { data: receipts, isLoading: receiptsLoading } = useCollection<Receipt>(receiptsQuery);

  const form = useForm<z.infer<typeof receiptSchema>>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      studentId: '',
      amount: 0,
      reason: 'School Fees',
      fileUrl: '',
    },
  });

  React.useEffect(() => {
    if (photoUrl) {
      form.setValue('fileUrl', photoUrl);
    }
  }, [photoUrl, form]);

  const onUploadSuccess = (ikResponse: any) => {
    setPhotoUrl(ikResponse.url);
    toast({ title: 'Upload Successful', description: 'Your receipt has been uploaded.' });
    setIsUploading(false);
  };

  const onUploadError = (err: any) => {
    toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    setIsUploading(false);
  };
  
  const onSubmit = async (values: z.infer<typeof receiptSchema>) => {
    if (!user || !firestore) return;
    const selectedChild = children?.find(c => c.id === values.studentId);
    if (!selectedChild) return;

    setIsSubmitting(true);
    const newReceipt = {
        ...values,
        parentUserId: user.uid,
        parentEmail: user.email,
        studentName: selectedChild.fullName,
        branchId: selectedChild.branchId,
        status: 'pending' as const,
        uploadedAt: serverTimestamp(),
      };

    addDoc(collection(firestore, 'receipts'), newReceipt).then(() => {
        toast({ title: 'Receipt Submitted', description: 'Your payment is now pending verification.' });
        form.reset();
        setPhotoUrl('');
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: 'receipts',
          operation: 'create',
          requestResourceData: newReceipt,
        });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
      setIsSubmitting(false);
    });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
          <CardDescription>
            Please make payments to the appropriate account below and upload your receipt for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-4 rounded-lg bg-secondary border space-y-4">
                <div className="text-center">
                    <p className="font-semibold text-lg">AL-HUFFAAZH ACADEMY NIGERIA LIMITED</p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Bank:</span> FIRST BANK OF NIGERIA</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {bankAccounts.map(account => (
                        <div key={account.number} className="flex justify-between items-center text-sm border-b py-1">
                            <span className="text-muted-foreground">{account.branch}:</span>
                            <span className="font-mono font-semibold text-foreground">{account.number}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Payment Receipt</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="fileUrl"
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
                            <UploadCloud className="h-12 w-12 text-muted-foreground" />
                            <FormLabel className="font-semibold">
                                {photoUrl ? 'Receipt Uploaded!' : 'Click to Upload Receipt'}
                            </FormLabel>
                            <FormControl>
                                <IKContext
                                    publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                                    urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                                    authenticator={imageKitAuthenticator}
                                >
                                    <IKUpload
                                        ref={ikUploadRef}
                                        fileName={`receipt_${user?.uid}_${Date.now()}.jpg`}
                                        folder="/receipts"
                                        onUploadStart={() => setIsUploading(true)}
                                        onSuccess={onUploadSuccess}
                                        onError={onUploadError}
                                        style={{ display: 'none' }}
                                    />
                                    <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>
                                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isUploading ? 'Uploading...' : (photoUrl ? 'Change Receipt' : 'Choose File')}
                                    </Button>
                                </IKContext>
                            </FormControl>
                            {photoUrl && <Image src={photoUrl} alt="Receipt preview" width={120} height={120} className="rounded-md object-cover"/>}
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Child/Student</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={childrenLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select the child this payment is for" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {children?.map(child => (
                                        <SelectItem key={child.id} value={child.id}>{child.fullName}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (₦)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 50000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason for Payment</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g. Term 1 School Fees" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Verification
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>My Payment History</CardTitle>
            <CardDescription>A log of all your submitted payments and their status.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount (₦)</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {receiptsLoading ? (
                        [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                        ))
                    ) : receipts && receipts.length > 0 ? (
                        receipts.map((t) => (
                        <TableRow key={t.id} className={t.status === 'rejected' ? 'bg-destructive/10' : ''}>
                            <TableCell>
                                <div className="font-medium">{t.studentName}</div>
                                <div className="text-sm text-muted-foreground">{t.reason}</div>
                            </TableCell>
                            <TableCell>{t.amount.toLocaleString()}</TableCell>
                            <TableCell>{t.uploadedAt ? formatDistanceToNow(new Date(t.uploadedAt.seconds * 1000), { addSuffix: true }) : 'N/A'}</TableCell>
                            <TableCell>
                                {getStatusBadge(t.status)}
                                {t.status === 'rejected' && t.rejectionReason && (
                                    <p className="text-xs text-destructive mt-1">{t.rejectionReason}</p>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <a href={t.fileUrl} target="_blank" rel="noopener noreferrer">View Receipt</a>
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No transactions yet.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
