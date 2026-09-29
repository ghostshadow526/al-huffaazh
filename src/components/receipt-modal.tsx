'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt as ReceiptIcon, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ReceiptData {
  id?: string;
  studentId?: string;
  studentName?: string;
  admissionNo?: string;
  branchId?: string;
  amount?: number;
  reason?: string;
  fileUrl?: string;
  receiptUrl?: string;
  photoUrl?: string;
  url?: string;
  imageUrl?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  uploadedAt?: { seconds: number; nanoseconds: number } | string | any;
  uploadedBy?: string;
  uploadedByRole?: string;
  paymentMethod?: string;
  referenceNo?: string;
  rejectionReason?: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptModal({ receipt, open, onOpenChange }: ReceiptModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Reset controls when a new receipt is opened
  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
      setImageError(false);
    }
  }, [open, receipt?.id, receipt?.fileUrl, receipt?.receiptUrl]);

  if (!receipt) return null;

  // Extract the receipt URL from any known field
  const rawUrl = 
    receipt.fileUrl || 
    receipt.receiptUrl || 
    receipt.photoUrl || 
    receipt.url || 
    receipt.imageUrl || 
    '';

  const isPdf = rawUrl.toLowerCase().includes('.pdf');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const toggleZoom = () => {
    setZoom((prev) => (prev === 1 ? 1.75 : 1));
  };

  const handleDownload = async () => {
    if (!rawUrl) return;
    const filename = `receipt-${(receipt.studentName || 'payment').replace(/\s+/g, '_')}-${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`;
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Direct download trigger without opening in a tab
      const link = document.createElement('a');
      link.href = rawUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="mr-1 h-3 w-3" /> Pending Verification
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || 'Submitted'}</Badge>;
    }
  };

  const formattedDate = () => {
    if (!receipt.uploadedAt) return 'Recent';
    if (typeof receipt.uploadedAt === 'object' && receipt.uploadedAt.seconds) {
      try {
        return formatDistanceToNow(new Date(receipt.uploadedAt.seconds * 1000), { addSuffix: true });
      } catch {
        return 'Recent';
      }
    }
    return String(receipt.uploadedAt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-primary" />
              Receipt: {receipt.studentName || 'Student Payment'}
            </DialogTitle>
            <div>{getStatusBadge(receipt.status)}</div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span><strong>Amount:</strong> ₦{(receipt.amount || 0).toLocaleString()}</span>
            <span><strong>Purpose:</strong> {receipt.reason || 'School Fees'}</span>
            {receipt.admissionNo && <span><strong>Adm No:</strong> {receipt.admissionNo}</span>}
            {receipt.branchId && <span><strong>Branch:</strong> {receipt.branchId}</span>}
            {receipt.referenceNo && <span><strong>Ref:</strong> {receipt.referenceNo}</span>}
            <span><strong>Submitted:</strong> {formattedDate()}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Rejection Note Alert if Rejected */}
        {receipt.status === 'rejected' && receipt.rejectionReason && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 my-2 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Rejection Reason:</strong> {receipt.rejectionReason}
            </div>
          </div>
        )}

        {/* Viewer Controls Toolbar */}
        {!isPdf && rawUrl && !imageError && (
          <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 rounded-lg border text-xs my-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In" className="h-7 w-7 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out" className="h-7 w-7 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRotate} title="Rotate Clockwise" className="h-7 w-7 p-0">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} title="Reset View" className="h-7 px-2 text-xs">
                Reset
              </Button>
              <span className="text-muted-foreground ml-2 font-mono">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-7 text-xs flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Download Receipt
              </Button>
            </div>
          </div>
        )}

        {/* Viewport Area */}
        <div className="flex-1 relative min-h-[350px] max-h-[500px] w-full border rounded-xl overflow-hidden bg-slate-950/5 flex items-center justify-center p-2">
          {!rawUrl ? (
            <div className="text-center p-8 text-muted-foreground space-y-2">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-sm">No receipt image or file attached to this record.</p>
              <p className="text-xs">Payment details are logged in the transaction ledger above.</p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <iframe
                src={rawUrl}
                className="w-full h-full min-h-[380px] rounded-lg border bg-white"
                title="PDF Receipt Viewer"
              />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="mr-1 h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          ) : imageError ? (
            <div className="text-center p-6 space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-sm font-medium text-foreground">Receipt image preview unavailable</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to load image preview. You may try refreshing or downloading the file directly.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { setImageError(false); setRetryKey((k) => k + 1); }}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
                </Button>
                <Button size="sm" variant="default" onClick={handleDownload}>
                  <Download className="mr-1.5 h-4 w-4" /> Download Receipt
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full overflow-auto flex items-center justify-center cursor-zoom-in"
              onClick={toggleZoom}
              title="Click receipt to zoom in / reset"
            >
              <img
                key={retryKey}
                src={rawUrl}
                alt={`Receipt for ${receipt.studentName || 'Payment'}`}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                  maxWidth: zoom <= 1 ? '100%' : 'none',
                  maxHeight: zoom <= 1 ? '450px' : 'none',
                  objectFit: 'contain',
                }}
                className="rounded shadow-sm select-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-3">
          <div className="text-xs text-muted-foreground">
            {receipt.uploadedBy && (
              <span>Uploaded by: <strong className="text-foreground">{receipt.uploadedBy}</strong> ({receipt.uploadedByRole || 'User'})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
