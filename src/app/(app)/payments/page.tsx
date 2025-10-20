
'use client';

import { useAuth } from '@/components/auth-provider';
import ParentPayments from '@/components/payments/parent-payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

function AdminPaymentsDisabled() {
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
                The payment management feature is currently unavailable. We are working to resolve this issue.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
}

export default function PaymentsPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Only render the ParentPayments component if the user is a parent.
  if (user.role === 'parent') {
    return <ParentPayments />;
  }
  
  // For admin roles, render a disabled message to prevent queries.
  if (user.role === 'super_admin' || user.role === 'branch_admin') {
    return <AdminPaymentsDisabled />;
  }

  // For any other role (like 'teacher'), deny access.
  return (
    <div className="text-center p-8">
      <h3 className="text-lg font-semibold">Access Denied</h3>
      <p className="text-muted-foreground">This page is not available for your role.</p>
    </div>
  );
}
