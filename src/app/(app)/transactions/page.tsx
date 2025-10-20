
'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IKContext, IKUpload } from 'imagekitio-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Info, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student } from '../students/student-table';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

const receiptSchema = z.object({
  studentId: z.string().min(1, 'Please select which child this payment is for.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  reason: z.string().min(1, 'Please select a reason.'),
  fileUrl: z.string().url('A receipt image is required.'),
});

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

export default function TransactionsPage() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [receiptFileUrl, setReceiptFileUrl] = useState('');
    const ikUploadRef = useRef<any>(null);

    const form = useForm<z.infer<typeof receiptSchema>>({
        resolver: zodResolver(receiptSchema),
        defaultValues: {
            studentId: '',
            amount: 0,
            reason: '',
            fileUrl: '',
        },
    });
    
    // Fetch children for the parent
    const childrenQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    }, [firestore, user?.uid]);
    const { data: children, isLoading: childrenLoading } = useCollection<Student>(childrenQuery);
    const studentOptions = children?.map(c => ({ value: c.id, label: c.fullName })) || [];

    // Fetch receipts for the parent, ensuring the query is correctly formed for the security rules
    const receiptsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        // This query now aligns with the security rule: `allow list: if request.query.get("parentUserId") == request.auth.uid;`
        return query(
            collection(firestore, 'receipts'), 
            where('parentUserId', '==', user.uid),
            orderBy('uploadedAt', 'desc')
        );
    }, [firestore, user?.uid]);
    const { data: receipts, isLoading: receiptsLoading } = useCollection<Receipt>(receiptsQuery);

    const onUploadSuccess = (ikResponse: any) => {
        setReceiptFileUrl(ikResponse.url);
        form.setValue('fileUrl', ikResponse.url);
        toast({ title: 'Receipt Uploaded', description: 'Your receipt is ready to be submitted.' });
        setIsUploading(false);
    };

    const onUploadError = (err: any) => {
        toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
        setIsUploading(false);
    };

    const onSubmit = async (values: z.infer<typeof receiptSchema>) => {
        if (!user || !firestore) return;
        
        const selectedStudent = children?.find(c => c.id === values.studentId);
        if (!selectedStudent) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find selected student.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'receipts'), {
                studentId: values.studentId,
                studentName: selectedStudent.fullName,
                parentUserId: user.uid,
                parentEmail: user.email,
                branchId: selectedStudent.branchId,
                amount: values.amount,
                reason: values.reason,
                fileUrl: values.fileUrl,
                status: 'pending',
                uploadedAt: serverTimestamp(),
            });

            toast({ title: 'Receipt Submitted', description: 'Your payment receipt is now pending review.' });
            form.reset();
            setReceiptFileUrl('');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Upload Payment Receipt</CardTitle>
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
                                        <FormField
                                            control={form.control}
                                            name="studentId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Child's Name</FormLabel>
                                                    <FormControl>
                                                        <Combobox
                                                            options={studentOptions}
                                                            onSelect={field.onChange}
                                                            value={field.value}
                                                            placeholder="Select child..."
                                                            searchText='Search for child...'
                                                            disabled={childrenLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField name="amount" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount Paid (₦)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 50000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    <FormField name="reason" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Payment</FormLabel>
                                            <FormControl>
                                               <Input placeholder="e.g., School Fees, Textbooks" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                     <FormField
                                        control={form.control}
                                        name="fileUrl"
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
                                                            fileName={`receipt_${user?.uid || 'user'}_${Date.now()}.jpg`}
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
                                            {receiptFileUrl && (
                                                <div className="mt-2 p-2 border rounded-md">
                                                    <Image src={receiptFileUrl} alt="Receipt preview" width={100} height={100} className="rounded-md object-cover" />
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
                                        Submit Receipt
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
                                <CardTitle>My Receipts</CardTitle>
                            </div>
                            <CardDescription>A list of your submitted receipts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {receiptsLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : receipts && receipts.length > 0 ? (
                                <div className="space-y-4">
                                {receipts.map((receipt) => (
                                    <div key={receipt.id} className="p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-lg">₦{receipt.amount.toLocaleString()}</p>
                                                <p className="text-sm font-medium">{receipt.studentName}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {receipt.reason}
                                                </p>
                                            </div>
                                             <Badge variant={receipt.status === 'pending' ? 'secondary' : receipt.status === 'approved' ? 'default' : 'destructive'}
                                                className={cn({
                                                    'bg-yellow-100 text-yellow-800': receipt.status === 'pending',
                                                    'bg-green-100 text-green-800': receipt.status === 'approved',
                                                })}
                                             >
                                                {receipt.status}
                                            </Badge>
                                        </div>
                                         {receipt.rejectionReason && <p className="text-xs text-destructive mt-1">Reason: {receipt.rejectionReason}</p>}
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {receipt.uploadedAt ? (
                                            <>
                                                <span>Submitted {formatDistanceToNow(new Date(receipt.uploadedAt.seconds * 1000), { addSuffix: true })}</span>
                                                <a href={receipt.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent underline">View Receipt</a>
                                            </>
                                            ) : <span>Processing...</span>}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No receipt records found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
