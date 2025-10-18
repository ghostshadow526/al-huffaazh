
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required.' }),
  dob: z.date({
    required_error: 'Date of birth is required.',
  }),
  class: z.string().min(1, { message: 'Class is required.' }),
  admissionNo: z.string().min(1, { message: 'Admission number is required.' }),
  photoUrl: z.string().url({ message: 'A photo is required.' }),
});

const imageKitAuthenticator = async () => {
  const response = await fetch('/api/imagekit/auth');
  const result = await response.json();
  return result;
};

export default function AddStudentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      class: '',
      admissionNo: '',
      photoUrl: '',
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
    try {
      const studentId = doc(db, 'students', 'new-id').id;

      // 1. Generate QR Code Data URI
      const baseUrl = window.location.origin;
      const qrResult = await generateUniqueQrCode({ studentId, baseUrl });
      
      // 2. Upload QR Code to ImageKit
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

      // 3. Create Student Document in Firestore
      const studentDocRef = doc(db, 'students', studentId);
      await setDoc(studentDocRef, {
        ...values,
        dob: format(values.dob, 'yyyy-MM-dd'),
        branchId: user.branchId,
        qrToken: studentId, // Using studentId as the unique token
        qrImageUrl: qrUploadResult.url,
        createdByUserId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Student Created',
        description: `${values.fullName} has been added to the system.`,
      });
      router.push('/students');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Student',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Student</CardTitle>
        <CardDescription>
          Fill in the details below to create a new student record.
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
  );
}
