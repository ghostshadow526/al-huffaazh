
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp, writeBatch, collection, Timestamp, query, where, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth, User } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { IKContext, IKUpload } from 'imagekitio-react';
import { generateUniqueQrCode } from '@/ai/flows/generate-unique-qr-code';
import { useAuth as useFirebaseAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { SCHOOL_CLASSES, CLASS_CATEGORIES } from '@/lib/constants/classes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, GraduationCap, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';


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
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState({ email: '', password: '' });

  const canAddStudent = user?.role === 'branch_admin' || user?.role === 'super_admin';

  // Query teachers in this branch
  const teachersQuery = useMemoFirebase(() => {
    if (!db || !user?.branchId) return null;
    if (user.role === 'super_admin') {
      return query(collection(db, 'users'), where('role', '==', 'teacher'));
    }
    return query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('branchId', '==', user.branchId)
    );
  }, [db, user?.branchId, user?.role]);

  const { data: branchTeachers } = useCollection<User>(teachersQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      class: user?.role === 'teacher' ? (user.assignedClass || '') : '',
      admissionNo: '',
      photoUrl: '',
      parentEmail: '',
      address: '',
    },
  });

  // Watch current class selection
  const selectedClass = form.watch('class');
  const assignedTeacherForClass = branchTeachers?.find(t => t.assignedClass === selectedClass);

  // Automatically lock teacher's class
  useEffect(() => {
    if (user?.role === 'teacher' && user.assignedClass) {
      form.setValue('class', user.assignedClass);
    }
  }, [user?.role, user?.assignedClass, form]);

  // Modal state for assigning/registering teacher under a class
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherModalTab, setTeacherModalTab] = useState<'create' | 'assign'>('create');
  const [targetClassForTeacher, setTargetClassForTeacher] = useState<string>('Basic 1 A');
  const [selectedTeacherIdToAssign, setSelectedTeacherIdToAssign] = useState('');
  const [isTeacherSubmitting, setIsTeacherSubmitting] = useState(false);

  // New teacher form state
  const [newTeacherFullName, setNewTeacherFullName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');

  // Keep targetClassForTeacher synced when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      setTargetClassForTeacher(selectedClass);
    }
  }, [selectedClass]);

  const handleAssignExistingTeacher = async () => {
    const classToAssign = targetClassForTeacher || selectedClass;
    if (!db || !selectedTeacherIdToAssign || !classToAssign) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select both a teacher and a class to assign.',
      });
      return;
    }
    setIsTeacherSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', selectedTeacherIdToAssign), {
        assignedClass: classToAssign,
      });
      const t = branchTeachers?.find(t => (t as any).id === selectedTeacherIdToAssign || t.uid === selectedTeacherIdToAssign);
      toast({
        title: 'Class Teacher Assigned',
        description: `${t?.fullName || 'Teacher'} has been assigned to ${classToAssign}.`,
      });
      form.setValue('class', classToAssign);
      setIsTeacherModalOpen(false);
      setSelectedTeacherIdToAssign('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: error.message || 'Could not assign teacher.',
      });
    } finally {
      setIsTeacherSubmitting(false);
    }
  };

  const handleRegisterNewTeacher = async () => {
    const classToAssign = targetClassForTeacher || selectedClass;
    const branchToAssign = user?.branchId || '';
    if (!db || !classToAssign) {
      toast({
        variant: 'destructive',
        title: 'Class Required',
        description: 'Please specify a class for this teacher.',
      });
      return;
    }
    if (!newTeacherFullName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in full name, email, and temporary password (min 6 characters).',
      });
      return;
    }
    if (newTeacherPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }
    setIsTeacherSubmitting(true);
    try {
      const secondaryApp = getApps().find(a => a.name === 'SecondaryTeacher') || initializeApp(firebaseConfig, 'SecondaryTeacher');
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newTeacherEmail.trim(), newTeacherPassword);
      const newUid = userCred.user.uid;

      await setDoc(doc(db, 'users', newUid), {
        uid: newUid,
        fullName: newTeacherFullName.trim(),
        email: newTeacherEmail.trim(),
        role: 'teacher',
        branchId: branchToAssign,
        assignedClass: classToAssign,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      await signOut(secondaryAuth);

      toast({
        title: 'Teacher Registered & Assigned',
        description: `${newTeacherFullName} registered as class teacher for ${classToAssign}.`,
      });
      form.setValue('class', classToAssign);
      setIsTeacherModalOpen(false);
      setNewTeacherFullName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Could not register new teacher.',
      });
    } finally {
      setIsTeacherSubmitting(false);
    }
  };

  useEffect(() => {
    if (photoUrl) {
      form.setValue('photoUrl', photoUrl);
    }
  }, [photoUrl, form]);

  const onUploadSuccess = (ikResponse: any) => {
    const rawUrl = ikResponse.url;
    // Compress to lowest quality to save space and storage for imagekit
    const compressedUrl = rawUrl.includes('?') 
      ? `${rawUrl}&tr=q-20,w-400` 
      : `${rawUrl}?tr=q-20,w-400`;

    setOriginalPhotoUrl(rawUrl);
    setPhotoUrl(compressedUrl);
    toast({
      title: 'Photo Uploaded & Compressed',
      description: 'Image compressed to lowest quality for storage efficiency, original quality preserved for retrieval.',
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

    if (user.role === 'teacher' || (user.role !== 'branch_admin' && user.role !== 'super_admin')) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized Action',
        description: 'Teachers are not permitted to register students. Adding students is reserved exclusively for Branch Administrators and Super Administrators.',
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
            photoUrl: photoUrl,
            originalPhotoUrl: originalPhotoUrl || photoUrl.split('?tr=')[0],
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
        <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Access Restricted
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Student registration is restricted. Only <strong>Branch Administrators</strong> and <strong>Super Administrators</strong> are authorized to enroll new students and generate parent accounts.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  As a teacher, you have full access to view class rosters, mark daily attendance via QR code or manual roll call, and submit examination scores.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Button onClick={() => router.push('/manage-students')} variant="outline">
                    View Student Records
                  </Button>
                  <Button onClick={() => router.push('/attendance')}>
                    Take Attendance
                  </Button>
                  <Button onClick={() => router.push('/results')} variant="secondary">
                    Enter Results
                  </Button>
                </div>
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
            {/* Top Action Banner for Branch Admin & Super Admin to Register / Assign Teacher under class */}
            {(user?.role === 'branch_admin' || user?.role === 'super_admin') && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Teacher Class Assignment</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Need to register a teacher or assign them to a class? When teachers log in, their results and attendance are organized around their designated class.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetClassForTeacher(selectedClass || 'Basic 1 A');
                    setIsTeacherModalOpen(true);
                  }}
                  className="w-full sm:w-auto shrink-0 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                >
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Register Teacher Under Class
                </Button>
              </div>
            )}

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
                        <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm font-semibold flex items-center justify-between">
                            <span>Class / Grade *</span>
                        </FormLabel>
                        <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 text-base rounded-lg border-2 font-medium">
                                    <SelectValue placeholder="Select class (e.g. JSS 1 A, Basic 1 B)" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {CLASS_CATEGORIES.map((category) => (
                                        <div key={category} className="py-1">
                                            <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 rounded">
                                                {category}
                                            </div>
                                            {SCHOOL_CLASSES.filter((c) => c.category === category).map((cls) => (
                                                <SelectItem key={cls.id} value={cls.name} className="py-2 font-medium">
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormMessage />

                        {/* Option for Branch Admin / Super Admin to view & assign a teacher under this class */}
                        {(user?.role === 'branch_admin' || user?.role === 'super_admin') && field.value && (
                            <div className="rounded-lg border bg-muted/40 p-2.5 sm:p-3 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-muted-foreground font-medium">Class Teacher:</span>
                                    {assignedTeacherForClass ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                                            {assignedTeacherForClass.fullName} ({assignedTeacherForClass.email})
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-semibold">
                                            No Teacher Assigned
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setTargetClassForTeacher(field.value);
                                        setIsTeacherModalOpen(true);
                                    }}
                                    className="h-7 text-xs font-semibold shrink-0"
                                >
                                    <UserPlus className="mr-1 h-3.5 w-3.5 text-primary" />
                                    {assignedTeacherForClass ? 'Change / Reassign Teacher' : 'Register / Assign Teacher Under This Class'}
                                </Button>
                            </div>
                        )}
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

      {/* Teacher Registration & Assignment Modal for Branch Admins */}
      <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <GraduationCap className="h-5 w-5 text-primary" />
              Assign or Register Teacher Under Class
            </DialogTitle>
            <DialogDescription>
              Assign a dedicated teacher to a specific class. Teachers will only be allowed to register students and manage scores under their assigned class.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class to Assign</Label>
              <Select value={targetClassForTeacher} onValueChange={setTargetClassForTeacher}>
                <SelectTrigger className="h-11 font-medium text-base">
                  <SelectValue placeholder="Select class (e.g. Basic 1 A, JSS 1 B)" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {CLASS_CATEGORIES.map((category) => (
                    <div key={category} className="py-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/60 rounded">
                        {category}
                      </div>
                      {SCHOOL_CLASSES.filter((c) => c.category === category).map((cls) => (
                        <SelectItem key={cls.id} value={cls.name} className="py-2 font-medium">
                          {cls.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={teacherModalTab} onValueChange={(v) => setTeacherModalTab(v as 'create' | 'assign')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="create">Register New Teacher</TabsTrigger>
                <TabsTrigger value="assign">Assign Existing Teacher</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Teacher's Full Name *</Label>
                  <Input
                    placeholder="e.g. Ustadh Musa Ibrahim"
                    value={newTeacherFullName}
                    onChange={(e) => setNewTeacherFullName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Teacher's Email *</Label>
                  <Input
                    type="email"
                    placeholder="musa.teacher@example.com"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Temporary Password *</Label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                  Creates an active teacher account restricted to class <strong>{targetClassForTeacher}</strong> in branch <strong>{user?.branchId || 'Current Branch'}</strong>.
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold h-11"
                  disabled={isTeacherSubmitting || !newTeacherFullName.trim() || !newTeacherEmail.trim() || newTeacherPassword.length < 6}
                  onClick={handleRegisterNewTeacher}
                >
                  {isTeacherSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering Teacher...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Register & Assign to {targetClassForTeacher}
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="assign" className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Select Branch Teacher *</Label>
                  {(!branchTeachers || branchTeachers.length === 0) ? (
                    <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No registered teachers found in this branch yet. Switch to the "Register New Teacher" tab to create one.
                    </div>
                  ) : (
                    <Select value={selectedTeacherIdToAssign} onValueChange={setSelectedTeacherIdToAssign}>
                      <SelectTrigger className="h-11 font-medium">
                        <SelectValue placeholder="Choose a teacher to assign" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {branchTeachers.map((t) => (
                          <SelectItem key={t.uid || (t as any).id} value={t.uid || (t as any).id}>
                            {t.fullName || t.email} {t.assignedClass ? `(Currently: ${t.assignedClass})` : '(Unassigned)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                  Assigns the selected teacher to <strong>{targetClassForTeacher}</strong>.
                </div>
                <Button
                  type="button"
                  className="w-full mt-2 font-semibold h-11"
                  disabled={isTeacherSubmitting || !selectedTeacherIdToAssign || !branchTeachers?.length}
                  onClick={handleAssignExistingTeacher}
                >
                  {isTeacherSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Assignment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Assign Teacher to {targetClassForTeacher}
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      </>
  );
}
