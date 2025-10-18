
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth as mainAuth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { IKContext, IKUpload } from 'imagekitio-react';
import { generateUniqueQrCode } from '@/ai/flows/generate-unique-qr-code';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Copy } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
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
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState({ email: '', password: '' });

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
    if (!user || !user.branchId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be assigned to a branch to add students.',
        });
        return;
    }
    setIsLoading(true);

    const tempApp = mainAuth.app;
    const { getAuth } = await import('firebase/auth');
    const tempAuth = getAuth(tempApp);
    
    try {
        const batch = writeBatch(db);

        // 1. Create Parent User Account
        const parentPassword = generatePassword();
        const parentUserCredential = await createUserWithEmailAndPassword(tempAuth, values.parentEmail, parentPassword);
        const parentUser = parentUserCredential.user;

        const parentUserDocRef = doc(db, 'users', parentUser.uid);
        batch.set(parentUserDocRef, {
            uid: parentUser.uid,
            fullName: `${values.fullName}'s Parent`,
            email: values.parentEmail,
            role: 'parent',
            branchId: user.branchId,
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
        const baseUrl = window.location.origin;
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
        // Sign out the newly created user and sign the admin back in
        await mainAuth.signOut();
        // You might need to re-authenticate the admin here if the session was lost.
        // For simplicity, we assume the onAuthStateChanged listener handles this.
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };


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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Admission Number</FormLabel>
                        <FormControl>
                            <Input placeholder="ALH/2025/001" {...field} />
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
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
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
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                            <Input placeholder="JSS 1" {...field} />
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
                        <FormLabel>Parent's Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="parent@example.com" {...field} />
                        </FormControl>
                         <FormDescription>An account will be created for the parent with this email.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="123, Main Street, Your City..."
                                className="resize-none"
                                {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter the student's full residential address.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Student
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
