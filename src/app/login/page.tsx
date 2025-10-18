
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Logo className="h-16 w-16 animate-pulse text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo className="h-16 w-16 text-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
            Al-Huffaazh Academy Portal
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Please sign in to your account.
          </p>
        </div>
        
        <Tabs defaultValue="teacher" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="parent">Parent</TabsTrigger>
          </TabsList>
          <TabsContent value="admin">
            <LoginForm role="admin" />
          </TabsContent>
          <TabsContent value="teacher">
            <LoginForm role="teacher" />
          </TabsContent>
          <TabsContent value="parent">
            <LoginForm role="parent" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
