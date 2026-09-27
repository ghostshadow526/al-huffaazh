
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { IKContext, IKUpload } from 'imagekitio-react';
import { generateUniqueQrCode } from '@/ai/flows/generate-unique-qr-code';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Copy } from 'lucide-react';
import { DateOfBirthPicker } from '@/components/ui/dob-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';


const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  dob: z.date({
    required_error: 'Date of birth is required.',
  }),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required.'}),
  address: z.string().min(10, { message: 'A detailed address is required.' }),
  class: z.string().min(1, { message: 'Class is required.' }),
  admissionNo: z.string().min(1, { message: 'Admission number is required.' }),
  photoUrl: z.string().url({ message: 'A photo is required.' }),
  parentEmail: z.string().email({ message: "Parent's email is required." }),
});

const imageKitAuthenticator = async () => {
  const response = await fetch('/api/imagekit/auth');
  const result = await response.json();
  return result;
};

// Function to generate a random password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

export default function AddStudentPage() {
  const { user } = useAuth();
  const mainAuth = useFirebaseAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState({ email: '', password: '' });

  const canAddStudent = user?.role === 'teacher' || user?.role === 'branch_admin' || user?.role === 'super_admin';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      class: '',
      admissionNo: '',
      photoUrl: '',
      parentEmail: '',
      address: '',
    },
  });

  useEffect(() => {
    if (photoUrl) {
      form.setValue('photoUrl', photoUrl);
    }
  }, [photoUrl, form]);

  const onUploadSuccess = (ikResponse: any) => {
    setPhotoUrl(ikResponse.url);
    toast({
      title: 'Photo Uploaded',
      description: 'The student\'s photo has been successfully uploaded.',
    });
    setIsLoading(false);
  };

  const onUploadError = (err: any) => {
    toast({
      variant: 'destructive',
      title: 'Upload Failed',
      description: err.message || 'Could not upload photo.',
    });
    setIsLoading(false);
  };
  
  const onUploadStart = () => {
    setIsLoading(true);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.branchId || !db || !mainAuth) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be assigned to a branch to add students.',
        });
        return;
    }
    setIsLoading(true);

    try {
        const secondaryApp = getApps().find(a => a.name === 'SecondaryAddStudent') || initializeApp(firebaseConfig, 'SecondaryAddStudent');
        const secondaryAuth = getAuth(secondaryApp);

        const batch = writeBatch(db);

        // 1. Create Parent User Account
        const parentPassword = generatePassword();
        const parentUserCredential = await createUserWithEmailAndPassword(secondaryAuth, values.parentEmail, parentPassword);
        const parentUser = parentUserCredential.user;
        await signOut(secondaryAuth);

        const parentUserDocRef = doc(db, 'users', parentUser.uid);
        batch.set(parentUserDocRef, {
            uid: parentUser.uid,
            fullName: `${values.fullName}'s Parent`,
            email: values.parentEmail,
            role: 'parent',
            branchId: user.branchId,
            status: 'active',
        });
        
        // 1.5 Store parent credentials temporarily
        const credentialDocRef = doc(db, 'parentCredentials', parentUser.uid);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days
        batch.set(credentialDocRef, {
          email: values.parentEmail,
          password: parentPassword,
          studentId: '', // we'll update this later
          expiresAt: Timestamp.fromDate(expiresAt),
        });


        // 2. Create Student Document
        const studentId = doc(collection(db, 'students')).id;
        const studentDocRef = doc(db, 'students', studentId);

        // 3. Generate QR Code
        const baseUrl = 'https://www.alhuffaazhacademynigerialtd.com';
        const qrResult = await generateUniqueQrCode({ studentId, baseUrl });
        
        // 4. Upload QR Code to ImageKit
        const qrUploadResponse = await fetch('/api/imagekit/auth-upload-qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: `${studentId}-qr.png`,
                file: qrResult.qrCodeDataUri,
            }),
        });

        if (!qrUploadResponse.ok) {
            throw new Error('Failed to upload QR code.');
        }
        const qrUploadResult = await qrUploadResponse.json();
        
        // 5. Update credential doc with student ID
        batch.update(credentialDocRef, { studentId: studentId });

        // 6. Set Student Data in Firestore
        batch.set(studentDocRef, {
            ...values,
            id: studentId,
            dob: format(values.dob, 'yyyy-MM-dd'),
            branchId: user.branchId,
            qrToken: studentId,
            qrImageUrl: qrUploadResult.url,
            createdByUserId: user.uid,
            createdAt: serverTimestamp(),
            parentUserId: parentUser.uid, // Link student to parent
            parentEmail: values.parentEmail, // Denormalize parent email
        });

        // 7. Commit all batched writes
        await batch.commit();

        setGeneratedCredentials({ email: values.parentEmail, password: parentPassword });
        setShowCredentials(true);

        toast({
            title: 'Student & Parent Created',
            description: `${values.fullName} and their parent's account have been added.`,
        });
        
        // Don't redirect immediately, show credentials first.
        // router.push('/manage-students');

    } catch (error: any) {
        console.error("Error during student creation:", error);
        let errorMessage = "An unknown error occurred.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "The parent's email address is already in use by another account.";
        } else {
            errorMessage = error.message;
        }
        toast({
            variant: 'destructive',
            title: 'Failed to Create Student',
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };


  if (!canAddStudent) {
    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You do not have permission to add new students. Please contact an administrator.</p>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </CardContent>
        </Card>
    );
  }


  return (
    <>
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Student</CardTitle>
        <CardDescription>
          Fill in the details below to create a new student record and a linked parent account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center gap-4">
                  <FormLabel>Student Photo</FormLabel>
                  <FormControl>
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center overflow-hidden bg-muted">
                      {photoUrl ? (
                         <Image src={photoUrl} alt="Student photo" width={192} height={192} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Upload Photo</span>
                      )}
                    </div>
                  </FormControl>
                  <IKContext
                    publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                    urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                    authenticator={imageKitAuthenticator}
                  >
                    <IKUpload
                      ref={ikUploadRef}
                      fileName={`${form.getValues('admissionNo') || 'student'}.jpg`}
                      folder="/students"
                      onUploadStart={onUploadStart}
                      onSuccess={onUploadSuccess}
                      onError={onUploadError}
                      style={{ display: 'none' }}
                    />
                     <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isLoading}>
                       {isLoading ? 'Uploading...' : 'Choose Photo'}
                    </Button>
                  </IKContext>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                 <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold">Full Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Ibrahim Abubakar" className="h-12 text-base rounded-lg border-2" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="admissionNo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold">Admission Number *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. ALH/2025/001" className="h-12 text-base rounded-lg border-2 font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-semibold">Date of Birth (Select Year, Month, Day) *</FormLabel>
                            <FormControl>
                                <DateOfBirthPicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Choose Birth Date (Year, Month, Day)"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-sm font-semibold">Gender *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="h-12 text-base rounded-lg border-2">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold">Class / Grade *</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. JSS 1, Primary 3, Tahfeezh" className="h-12 text-base rounded-lg border-2" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="parentEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-sm font-semibold">Parent's Email *</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="parent@example.com" className="h-12 text-base rounded-lg border-2" {...field} />
                        </FormControl>
                         <FormDescription className="text-xs">An account will be created automatically for the parent with this email.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-semibold">Residential Address *</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="123, Main Street, City / Area..."
                                className="min-h-[90px] text-base rounded-lg border-2 resize-none"
                                {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Enter the student's full residential address.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-12 text-base" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-12 text-base font-semibold px-8">
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Create Student Record
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
    
    <AlertDialog open={showCredentials} onOpenChange={setShowCredentials}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parent Account Created Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Please copy and securely share these login credentials with the parent. This information will only be shown once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-1">
                <Label htmlFor="parent-email">Parent Email</Label>
                <div className="flex items-center gap-2">
                    <Input id="parent-email" value={generatedCredentials.email} readOnly />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.email)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="parent-password">Temporary Password</Label>
                 <div className="flex items-center gap-2">
                    <Input id="parent-password" value={generatedCredentials.password} readOnly />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedCredentials.password)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/manage-students')}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
  );
}
