
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type Role = "admin" | "teacher" | "parent";
const validRolesForAdminTab: string[] = ['super_admin', 'branch_admin'];


export function LoginForm({ role }: { role: Role }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "Firebase is not initialized."});
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Firestore document check
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Special case for the hardcoded super admin who might not have a doc initially
        const superAdminEmail = "alhuffazh@gmail.com";
        const adminToken = "4MPWGavMNqZLtdUGqtWvUYY0xDL2";
        if (user.email === superAdminEmail && user.uid === adminToken && role === 'admin') {
           toast({ title: "Success", description: "Admin logged in successfully. Redirecting..." });
           router.push('/dashboard');
           setIsLoading(false);
           return;
        }

        // If not the super admin and no doc, deny access
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Your user account does not exist in our records. Please contact an administrator.",
        });
        setIsLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const userRole = userData.role;

      let canLogin = false;
      let expectedRoleTab = userRole;

      switch(userRole) {
        case 'super_admin':
        case 'branch_admin':
          if (role === 'admin') canLogin = true;
          expectedRoleTab = 'admin';
          break;
        case 'teacher':
          if (role === 'teacher') canLogin = true;
          break;
        case 'parent':
            if (role === 'parent') canLogin = true;
            break;
      }


      if (canLogin) {
        toast({
          title: "Success",
          description: "Logged in successfully. Redirecting to dashboard...",
        });
        router.push('/dashboard');
      } else {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Role Mismatch",
          description: `Your account is a '${userRole?.replace('_', ' ')}'. Please use the '${expectedRoleTab}' tab to log in.`,
        });
      }

    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
       <CardHeader>
        <CardTitle className="capitalize">{role} Login</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
         <p className="mt-4 text-center text-sm text-muted-foreground">
          Go back to{' '}
          <Link href="/" className="underline underline-offset-4 hover:text-primary">
            Homepage
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
