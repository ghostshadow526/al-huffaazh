
'use client';

import { useAuth } from '@/components/auth-provider';
import ParentPayments from '@/components/payments/parent-payments';
import AdminPayments from '@/components/payments/admin-payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentsPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'parent') {
    return <ParentPayments />;
  }
  
  if (user.role === 'super_admin' || user.role === 'branch_admin') {
    return <AdminPayments />;
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is not available for your role.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">The payments section can only be accessed by parents and administrators.</p>
        </CardContent>
    </Card>
  );
}
