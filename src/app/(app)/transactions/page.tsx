
'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IKContext, IKUpload } from 'imagekitio-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Info, History } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const transactionSchema = z.object({
  studentName: z.string().min(1, 'Please enter the name of the child.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than zero.'),
  reason: z.string().min(1, 'Please provide a reason.'),
  receiptUrl: z.string().url('A receipt image is required.'),
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

export default function TransactionsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const ikUploadRef = useRef<any>(null);
    const [mockTransactions, setMockTransactions] = useState<z.infer<typeof transactionSchema>[]>([]);

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            studentName: '',
            amount: 0,
            reason: '',
            receiptUrl: '',
        },
    });

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

    const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
        setIsSubmitting(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Add to mock local state
        setMockTransactions(prev => [values, ...prev]);

        toast({ title: 'Transaction Submitted (Mock)', description: 'This is a mock submission. No data was saved.' });
        form.reset();
        setReceiptUrl('');
        
        setIsSubmitting(false);
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Submit a Transaction</CardTitle>
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
                                        <FormField name="studentName" control={form.control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Child's Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter student's full name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
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
                                            <FormLabel>Reason for Transaction</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., School Fees, Textbooks" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

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
                                        Submit Transaction
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
                                <CardTitle>Mock Transaction History</CardTitle>
                            </div>
                            <CardDescription>A temporary list of your submitted transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mockTransactions.length > 0 ? (
                                <div className="space-y-4">
                                {mockTransactions.map((transaction, index) => (
                                    <div key={index} className="p-4 rounded-lg border bg-secondary/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-lg">₦{transaction.amount.toLocaleString()}</p>
                                                <p className="text-sm font-medium">{transaction.studentName}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {transaction.reason}
                                                </p>
                                            </div>
                                             <Badge variant="secondary">Pending</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            <span>Submitted on {format(new Date(), 'MMM d, yyyy')}</span>
                                            <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent underline">View Receipt</a>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No transaction records found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

