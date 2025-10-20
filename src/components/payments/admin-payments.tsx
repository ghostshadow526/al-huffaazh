
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function AdminPayments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Payments</CardTitle>
        <CardDescription>Review and manage all submitted fee payments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Feature Temporarily Disabled</AlertTitle>
          <AlertDescription>
            The payment management feature is currently unavailable due to a persistent technical issue. We are working to resolve it.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
