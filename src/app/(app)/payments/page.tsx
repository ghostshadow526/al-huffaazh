
'use client';

import { useAuth } from '@/components/auth-provider';
import ParentPayments from '@/components/payments/parent-payments';
import AdminPayments from '@/components/payments/admin-payments';

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
    <div className="text-center">
      <p>This page is not available for your role.</p>
    </div>
  );
}

    