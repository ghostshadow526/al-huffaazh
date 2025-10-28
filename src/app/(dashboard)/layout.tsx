
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import DashboardLayout from "@/app/dashboard-layout";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Logo className="h-16 w-16 animate-pulse text-accent" />
      </div>
    );
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
