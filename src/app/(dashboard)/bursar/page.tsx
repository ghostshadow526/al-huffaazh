'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Search, 
  Receipt as ReceiptIcon, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2, 
  UserCheck, 
  FileCheck, 
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Student {
  id: string;
  fullName: string;
  admissionNo: string;
  class: string;
  branchId: string;
  parentUserId?: string;
  parentEmail?: string;
  photoUrl?: string;
}

interface Receipt {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo?: string;
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
  rejectionReason?: string;
}

const PAYMENT_REASONS = [
  'Term Tuition Fee',
  'Boarding & Hostel Fee',
  'Academy Uniform & Attire',
  'Books, Quran & Stationery',
  'Examination & Assessment Fee',
  'School Bus & Transportation',
  'Tahfeez Intensive Program',
  'New Student Registration Fee',
  'Development & Facility Levy',
  'Other Educational Charges',
];

const PAYMENT_METHODS = [
  'Direct Bank Transfer',
  'Bank Teller / Cash Deposit',
  'POS Terminal Payment',
  'Online Payment Gateway',
  'Cash to Bursary',
];

export default function BursarPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);

  // Form state
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(PAYMENT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

  // Load all students for fast fuzzy/database searching
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'students');
  }, [firestore, user]);

  const { data: allStudents, isLoading: isStudentsLoading } = useCollection<Student>(studentsQuery);

  // Search filter
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return (allStudents || []).filter(student => 
      student.fullName?.toLowerCase().includes(term) ||
      student.admissionNo?.toLowerCase().includes(term) ||
      student.class?.toLowerCase().includes(term) ||
      student.branchId?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [allStudents, searchTerm]);

  // Query receipts uploaded by this bursar (or all receipts if super_admin)
  const bursarReceiptsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'super_admin') {
      return collection(firestore, 'receipts');
    }
    // Query receipts uploaded by bursar
    return query(collection(firestore, 'receipts'), where('uploadedByRole', '==', 'burser'));
  }, [firestore, user]);

  const { data: receiptsList, isLoading: isReceiptsLoading } = useCollection<Receipt>(bursarReceiptsQuery);

  // File upload handler (compresses / converts or uploads via ImageKit auth endpoint)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // 1. Fetch ImageKit authentication parameters
      const authRes = await fetch('/api/imagekit/auth');
      if (!authRes.ok) throw new Error('Could not authenticate with media server.');
      const authData = await authRes.json();

      // 2. Prepare FormData for direct ImageKit upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `receipt-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
      formData.append('publicKey', authData.publicKey || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '');
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);
      formData.append('folder', '/bursar-receipts');

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        setReceiptFileUrl(uploadJson.url);
        toast({
          title: 'Receipt Image Uploaded',
          description: 'Receipt has been uploaded and ready to tie to student record.',
        });
      } else {
        // Fallback: read as base64 data URI if network direct upload fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptFileUrl(reader.result as string);
          toast({
            title: 'Receipt Image Processed',
            description: 'Local receipt image prepared successfully.',
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn('ImageKit direct upload fallback to local reader:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptFileUrl(reader.result as string);
        toast({
          title: 'Receipt Processed',
          description: 'Receipt image attached successfully.',
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit Receipt and tie to Student
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    if (!selectedStudent) {
      toast({
        variant: 'destructive',
        title: 'Student Required',
        description: 'Please search and select a student from the database first.',
      });
      return;
    }

    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount.',
      });
      return;
    }

    if (!receiptFileUrl) {
      toast({
        variant: 'destructive',
        title: 'Receipt Image Required',
        description: 'Please upload the payment teller, receipt scan, or proof of payment.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalReason = reason === 'Other Educational Charges' && customReason.trim() 
        ? customReason.trim() 
        : reason;

      const receiptData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName,
        admissionNo: selectedStudent.admissionNo || '',
        branchId: selectedStudent.branchId || user.branchId || '',
        parentUserId: selectedStudent.parentUserId || '',
        parentEmail: selectedStudent.parentEmail || '',
        amount: numAmount,
        reason: finalReason,
        paymentMethod,
        paymentDate,
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
        fileUrl: receiptFileUrl,
        status: 'pending' as const,
        uploadedAt: serverTimestamp(),
        uploadedBy: user.fullName || user.email || 'Bursar',
        uploadedByRole: 'burser' as const,
      };

      await addDoc(collection(firestore, 'receipts'), receiptData);

      toast({
        title: 'Receipt Submitted for Approval!',
        description: `Payment of ₦${numAmount.toLocaleString()} for ${selectedStudent.fullName} sent to Super Admin (Status: Pending).`,
      });

      // Reset form
      setSelectedStudent(null);
      setSearchTerm('');
      setAmount('');
      setReferenceNo('');
      setNotes('');
      setReceiptFileUrl('');
      setCustomReason('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not submit receipt. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="mr-1 h-3 w-3" />Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
    }
  };

  // Restrict access to burser and super_admin
  if (user && user.role !== 'burser' && user.role !== 'super_admin') {
    return (
      <Card className="max-w-2xl mx-auto my-12 border-destructive/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Bursar Access Only</CardTitle>
          <CardDescription className="text-base mt-2">
            This portal is reserved for Academy Bursars and the Super Administrator to enter and tie payment receipts to student accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ReceiptIcon className="h-8 w-8 text-primary" /> Bursar Receipt Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Search any student in the database, attach bank receipts or payment proofs, and submit directly to the Super Admin for payment verification.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-center bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 font-medium">
          Role: Bursar
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 1: Student Search & Selection Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> 1. Search Student in Database
              </CardTitle>
              <CardDescription>
                Type student&apos;s name or admission number to query the academy database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Fatima, Ibrahim, ADM-2024..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Selected Student Highlight */}
              {selectedStudent ? (
                <div className="p-4 rounded-lg border-2 border-primary/40 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> Selected Student Tied to Receipt
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-muted-foreground hover:text-destructive h-7"
                    >
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={selectedStudent.photoUrl} alt={selectedStudent.fullName} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {selectedStudent.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{selectedStudent.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Adm No: <span className="font-mono font-medium text-foreground">{selectedStudent.admissionNo || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Class: <span className="font-medium text-foreground">{selectedStudent.class || 'N/A'}</span> • Branch: <span className="font-medium text-foreground">{selectedStudent.branchId || 'Head Office'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchTerm.trim() ? (
                    filteredStudents.length > 0 ? (
                      <div className="divide-y border rounded-md max-h-72 overflow-y-auto">
                        {filteredStudents.map((st) => (
                          <div 
                            key={st.id} 
                            onClick={() => setSelectedStudent(st)}
                            className="p-3 hover:bg-muted cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={st.photoUrl} alt={st.fullName} />
                                <AvatarFallback>{st.fullName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm text-foreground">{st.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {st.admissionNo ? `Adm: ${st.admissionNo}` : ''} • {st.class || ''} • {st.branchId || ''}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="secondary" className="h-7 text-xs">
                              Select
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground border rounded-md border-dashed">
                        No students found matching &quot;{searchTerm}&quot;.
                      </div>
                    )
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground border rounded-md border-dashed bg-muted/20">
                      Enter a name or admission number above to search across all academy branches.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-primary" /> Bursary Verification Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <p>1. When a receipt is submitted, its status is automatically marked as <strong>Pending</strong>.</p>
              <p>2. It instantly reflects on the Super Admin&apos;s <em>All Transactions</em> ledger.</p>
              <p>3. Once the Super Admin reviews the bank statement and approves, the status updates to <strong>Approved</strong> in real-time.</p>
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Upload Receipt & Details Form */}
        <div className="lg:col-span-7">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> 2. Upload Receipt & Payment Details
              </CardTitle>
              <CardDescription>
                {selectedStudent 
                  ? `Entering receipt details for ${selectedStudent.fullName} (${selectedStudent.admissionNo || 'No Admission No'})`
                  : 'Please search and select a student on the left before submitting.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount Paid (₦) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Payment Purpose *</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select Purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Payment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                {reason === 'Other Educational Charges' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-reason">Specify Payment Purpose</Label>
                    <Input
                      id="custom-reason"
                      placeholder="e.g. Graduation Gown Fee, Arabic competition levy..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}

                {/* Reference / Teller Number */}
                <div className="space-y-2">
                  <Label htmlFor="reference">Bank Reference / Teller / Transaction ID</Label>
                  <Input
                    id="reference"
                    placeholder="e.g. NIBSS-9823481239, GTB Teller #4421"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>

                {/* Receipt File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="receipt-file">Upload Payment Receipt / Teller (Image or PDF) *</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="receipt-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploadingImage}
                      className="cursor-pointer file:cursor-pointer"
                    />
                    {isUploadingImage && <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />}
                  </div>

                  {/* Receipt Preview */}
                  {receiptFileUrl && (
                    <div className="mt-3 p-3 border rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {receiptFileUrl.endsWith('.pdf') ? (
                          <div className="h-14 w-14 bg-red-100 text-red-700 rounded flex items-center justify-center font-bold text-xs">
                            PDF
                          </div>
                        ) : (
                          <img 
                            src={receiptFileUrl} 
                            alt="Receipt Preview" 
                            className="h-14 w-14 object-cover rounded border"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Receipt Attached
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            Ready for submission
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReceiptFileUrl('')}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Bursar Remarks / Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional bank or verification details for the Super Admin..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-base py-6 bg-primary hover:bg-primary/90 mt-4"
                  disabled={!selectedStudent || !receiptFileUrl || isSubmitting || isUploadingImage}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Receipt to Super Admin...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Tie Receipt to {selectedStudent?.fullName || 'Student'} & Submit
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bursar's Submitted Receipts Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5 text-primary" /> Submitted Receipts Ledger
              </CardTitle>
              <CardDescription>
                Live tracker of receipts submitted by the Bursar and their Super Admin verification status.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Total: {receiptsList ? receiptsList.length : 0} Receipts
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Reference / Method</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isReceiptsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : receiptsList && receiptsList.length > 0 ? (
                  receiptsList.map((rc) => (
                    <TableRow key={rc.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-semibold text-foreground">{rc.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {rc.admissionNo ? `Adm: ${rc.admissionNo}` : ''} {rc.branchId ? `• ${rc.branchId}` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-700 whitespace-nowrap">
                        ₦{(rc.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{rc.reason}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono">{rc.referenceNo || 'No Ref'}</div>
                        <div className="text-xs text-muted-foreground">{rc.paymentMethod || 'Transfer'}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {rc.uploadedAt?.seconds ? formatDistanceToNow(new Date(rc.uploadedAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(rc.status)}
                          {rc.status === 'rejected' && rc.rejectionReason && (
                            <p className="text-xs text-destructive italic max-w-[160px] truncate" title={rc.rejectionReason}>
                              Reason: {rc.rejectionReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {rc.fileUrl ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPreviewReceipt(rc)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No file</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                      No receipts uploaded yet. Use the form above to tie and submit your first payment receipt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal Preview */}
      <Dialog open={!!previewReceipt} onOpenChange={(open) => !open && setPreviewReceipt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-primary" /> Receipt: {previewReceipt?.studentName}
            </DialogTitle>
            <DialogDescription>
              Amount: ₦{previewReceipt?.amount?.toLocaleString()} • Status: {previewReceipt?.status}
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
    </div>
  );
}
