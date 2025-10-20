
'use client';

import { useAuth } from '@/components/auth-provider';
import ParentTransactions from '@/components/transactions/parent-transactions';
import AdminTransactions from '@/components/transactions/admin-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionsPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'parent') {
    return <ParentTransactions />;
  }
  
  if (user.role === 'super_admin' || user.role === 'branch_admin') {
    return <AdminTransactions />;
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is not available for your role.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">The transactions section can only be accessed by parents and administrators.</p>
        </CardContent>
    </Card>
  );
}
