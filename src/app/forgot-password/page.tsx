
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const auth = getAuth(); // Use client-side auth

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setIsSuccess(true);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${values.email}, a reset link has been sent.`,
      });
    } catch (error: any) {
      // We show a generic success message to prevent email enumeration, but log the error.
      setIsSuccess(true);
      console.error("Forgot password error:", error.message);
       toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${values.email}, a reset link has been sent.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <Logo className="h-16 w-16 text-accent" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">
                    Forgot Password
                </h1>
                <p className="text-muted-foreground">
                    Enter your email to receive a password reset link.
                </p>
            </div>
            <Card>
                {isSuccess ? (
                    <>
                        <CardHeader>
                            <CardTitle>Check Your Email</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">A password reset link has been sent to the email address you provided, if an account with that email exists. Please check your inbox (and spam folder).</p>
                        </CardContent>
                         <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/login">Back to Login</Link>
                            </Button>
                        </CardFooter>
                    </>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                             <CardHeader>
                                <CardDescription>
                                No problem! We'll send you a link to reset it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Reset Link
                                </Button>
                                 <Button asChild variant="link" className="w-full">
                                    <Link href="/login">Back to Login</Link>
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                )}
            </Card>
        </div>
    </div>
  );
}
