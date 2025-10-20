
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IKContext, IKUpload } from 'imagekitio-react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, doc, writeBatch, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@/app/(app)/students/student-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Info, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select which child this payment is for.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  paymentReason: z.enum(['school_fees', 'excursion', 'other']),
  otherReason: z.string().optional(),
  receiptUrl: z.string().url('A receipt image is required.'),
}).refine(data => {
  if (data.paymentReason === 'other') {
    return !!data.otherReason && data.otherReason.length > 5;
  }
  return true;
}, {
  message: 'Please provide a brief description for your payment reason.',
  path: ['otherReason'],
});

interface PaymentRecord {
    id: string;
    studentName: string;
    amount: number;
    paymentReason: string;
    otherReason?: string;
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: any;
    receiptUrl: string;
    rejectionReason?: string;
}

const imageKitAuthenticator = async () => {
    const response = await fetch('/api/imagekit/auth');
    const result = await response.json();
    return result;
};

const bankDetails = {
    bankName: "Unity Bank Plc",
    accountNumber: "0023456789",
    accountName: "Al-Huffaazh Academy",
};


export default function ParentPayments() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const ikUploadRef = useRef<any>(null);

    const childrenQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    }, [firestore, user?.uid]);

    const { data: children, isLoading: childrenLoading } = useCollection<Student>(childrenQuery);
    
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'payments'), where('parentUserId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user?.uid]);

    const { data: payments, isLoading: paymentsLoading } = useCollection<PaymentRecord>(paymentsQuery);

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            studentId: '',
            amount: 0,
            paymentReason: 'school_fees',
            otherReason: '',
            receiptUrl: '',
        },
    });

    const paymentReason = useWatch({ control: form.control, name: 'paymentReason' });

    const onUploadSuccess = (ikResponse: any) => {
        setReceiptUrl(ikResponse.url);
        form.setValue('receiptUrl', ikResponse.url);
        toast({ title: 'Receipt Uploaded', description: 'Your receipt is ready to be submitted.' });
        setIsUploading(false);
    };

    const onUploadError = (err: any) => {
        toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
        setIsUploading(false);
    };

    const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
        if (!user || !firestore || !children) return;
        setIsSubmitting(true);

        try {
            const batch = writeBatch(firestore);
            const student = children.find(c => c.id === values.studentId);
            if (!student) throw new Error('Selected child not found.');

            // 1. Create Payment Record
            const paymentId = doc(collection(firestore, 'payments')).id;
            const paymentRef = doc(firestore, 'payments', paymentId);
            batch.set(paymentRef, {
                ...values,
                studentName: student.fullName,
                parentUserId: user.uid,
                branchId: student.branchId,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // 2. Create Notifications for Admins
            const adminsQuery = query(collection(firestore, 'users'), where('role', 'in', ['super_admin', 'branch_admin']));
            const adminsSnapshot = await getDocs(adminsQuery);
            
            adminsSnapshot.forEach(adminDoc => {
                const admin = adminDoc.data();
                // Notify super_admins and the relevant branch_admin
                if (admin.role === 'super_admin' || (admin.role === 'branch_admin' && admin.branchId === student.branchId)) {
                    const notificationRef = doc(collection(firestore, 'notifications'));
                    batch.set(notificationRef, {
                        userId: admin.uid,
                        message: `New payment of ${values.amount} submitted for ${student.fullName}.`,
                        link: '/payments',
                        read: false,
                        createdAt: serverTimestamp(),
                    });
                }
            });
            
            await batch.commit();

            toast({ title: 'Payment Submitted', description: 'Your payment is now pending confirmation.' });
            form.reset();
            setReceiptUrl('');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Submit a New Payment</CardTitle>
                            <CardDescription>
                                After making a transfer to the account below, fill out this form and upload your receipt.
                            </CardDescription>
                        </CardHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <CardContent className="space-y-6">
                                     <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Bank Transfer Details</AlertTitle>
                                        <AlertDescription>
                                            <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                                            <p><strong>Account Number:</strong> {bankDetails.accountNumber}</p>
                                            <p><strong>Account Name:</strong> {bankDetails.accountName}</p>
                                        </AlertDescription>
                                    </Alert>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="studentId" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>For Child</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={childrenLoading}>
                                                     <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select your child" />
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
                                        )} />
                                        <FormField name="amount" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount Paid</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 50000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField name="paymentReason" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Payment</FormLabel>
                                             <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="school_fees">School Fees</SelectItem>
                                                    <SelectItem value="excursion">Excursion / Trip</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {paymentReason === 'other' && (
                                        <FormField name="otherReason" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Specify Reason (if other)</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g., Textbooks and stationery" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}

                                     <FormField
                                        control={form.control}
                                        name="receiptUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Upload Receipt</FormLabel>
                                            <FormControl>
                                                <div>
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
                                                    </IKContext>
                                                    <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>
                                                        <UploadCloud className="mr-2 h-4 w-4" />
                                                        {isUploading ? 'Uploading...' : 'Choose Receipt Image'}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormDescription>Please upload a clear picture or screenshot of your payment receipt.</FormDescription>
                                            {receiptUrl && (
                                                <div className="mt-2 p-2 border rounded-md">
                                                    <Image src={receiptUrl} alt="Receipt preview" width={100} height={100} className="rounded-md object-cover" />
                                                </div>
                                            )}
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" disabled={isSubmitting || isUploading}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Payment
                                    </Button>
                                </CardFooter>
                            </form>
                        </Form>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                             <div className="flex items-center gap-2">
                                <History className="h-6 w-6" />
                                <CardTitle>Payment History</CardTitle>
                            </div>
                            <CardDescription>A record of all your submitted payments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentsLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : payments && payments.length > 0 ? (
                                <div className="space-y-4">
                                {payments.map(payment => (
                                    <div key={payment.id} className="p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-lg">${payment.amount.toLocaleString()}</p>
                                                <p className="text-sm font-medium">{payment.studentName}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {payment.paymentReason.replace('_', ' ')}
                                                    {payment.paymentReason === 'other' && `: ${payment.otherReason}`}
                                                </p>
                                            </div>
                                             <Badge variant={getStatusVariant(payment.status)} className="capitalize">{payment.status}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            <span>Submitted on {format(payment.createdAt.toDate(), 'MMM d, yyyy')}</span>
                                            <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent underline">View Receipt</a>
                                        </div>
                                        {payment.status === 'rejected' && payment.rejectionReason && (
                                            <p className="text-xs text-destructive mt-1">Reason: {payment.rejectionReason}</p>
                                        )}
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No payment records found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
