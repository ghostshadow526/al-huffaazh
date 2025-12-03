
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, query, where, writeBatch, doc, getDocs, setDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import type { Student } from '../students/student-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IKContext, IKUpload } from 'imagekitio-react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


const resultSchema = z.object({
  studentId: z.string().min(1, 'Please select a student.'),
  termId: z.string().min(1, 'Please select a term.'),
  scores: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    marks: z.coerce.number().min(0, 'Marks must be positive.').max(100, 'Marks cannot exceed 100.'),
    grade: z.string().optional(),
  })),
});

const reportCardSchema = z.object({
    studentId: z.string().min(1, 'Please select a student.'),
    termId: z.string().min(1, 'Please select a term.'),
    imageUrl: z.string().url('Please upload a result sheet image.'),
});

interface Term {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  category: string;
}

interface Result {
    id: string;
    studentId: string;
    studentName: string;
    termId: string;
    termName: string;
    subjectId: string;
    subjectName: string;
    marks: number;
}


const imageKitAuthenticator = async () => {
    const response = await fetch('/api/imagekit/auth');
    const result = await response.json();
    return result;
};

function CreateSubjectForm({ onSubjectCreated }: { onSubjectCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const firestore = useFirestore();
    const {toast} = useToast();

    const subjectFormSchema = z.object({
        name: z.string().min(3, "Subject name is required."),
        category: z.enum(['core', 'islamic', 'general']),
    });

    const form = useForm<z.infer<typeof subjectFormSchema>>({
        resolver: zodResolver(subjectFormSchema),
        defaultValues: { name: "", category: 'general' }
    });

    async function onSubmit(values: z.infer<typeof subjectFormSchema>) {
        if (!firestore) return;
        setIsSaving(true);
        try {
            const id = values.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            await setDoc(doc(firestore, 'subjects', id), { ...values, id });
            toast({ title: "Subject Created", description: `"${values.name}" has been added.`});
            onSubjectCreated();
            setOpen(false);
            form.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    }
    
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add New Subject</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create a New Subject</AlertDialogTitle>
                            <AlertDialogDescription>
                                This subject will be saved and available for all teachers to use in the future.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Subject Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Computer Science" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="core">Core</SelectItem>
                                            <SelectItem value="islamic">Islamic</SelectItem>
                                            <SelectItem value="general">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Subject
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ScoresForm({ students, terms, subjects, studentOptions, isLoading, onDataChange } : any) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof resultSchema>>({
        resolver: zodResolver(resultSchema),
        defaultValues: { studentId: '', termId: '', scores: [] },
    });
    
    const { fields, replace } = useFieldArray({ control: form.control, name: "scores" });

    useEffect(() => {
        if (subjects) {
          const scores = subjects.map(subject => ({
            subjectId: subject.id,
            subjectName: subject.name,
            marks: 0,
            grade: '',
          }));
          replace(scores);
        }
      }, [subjects, replace]);


      async function onSubmit(values: z.infer<typeof resultSchema>) {
        if (!user || !firestore) return;
        setIsSubmitting(true);
    
        const batch = writeBatch(firestore);
        const termName = terms?.find(t => t.id === values.termId)?.name || 'Unknown Term';
        const studentName = students?.find(s => s.id === values.studentId)?.fullName || 'Unknown Student';
        const studentBranchId = students?.find(s => s.id === values.studentId)?.branchId;
    
        values.scores.forEach(score => {
          if (score.marks > 0 || score.grade) { // Only save if there's a mark or grade
            const resultId = `${values.studentId}_${values.termId}_${score.subjectId}`;
            const resultDocRef = doc(firestore, 'results', resultId);
            batch.set(resultDocRef, {
              studentId: values.studentId,
              termId: values.termId,
              subjectId: score.subjectId,
              branchId: studentBranchId || user.branchId,
              marks: score.marks,
              grade: score.grade || '',
              recordedBy: user.uid,
              recordedAt: serverTimestamp(),
              studentName,
              termName,
              subjectName: score.subjectName
            }, { merge: true });
          }
        });
    
        try {
          await batch.commit();
          toast({
            title: 'Results Saved',
            description: `Successfully saved results for ${studentName}.`,
          });
          form.reset();
          const scores = subjects?.map(subject => ({ subjectId: subject.id, subjectName: subject.name, marks: 0, grade: '' })) || [];
          replace(scores);
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Failed to Save Results',
            description: error.message,
          });
        } finally {
          setIsSubmitting(false);
        }
      }

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className='space-y-6'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Student</FormLabel>
                            <FormControl>
                            <Combobox
                                options={studentOptions}
                                onSelect={field.onChange}
                                placeholder="Select student..."
                                searchText="Search for a student..."
                                disabled={isLoading}
                                value={field.value}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="termId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Term</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a term" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {terms?.map(term => (
                                        <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Enter Scores & Grades</h3>
                            <CreateSubjectForm onSubjectCreated={onDataChange} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="space-y-2 rounded-md border p-3">
                                    <FormLabel className="text-sm font-medium">{field.subjectName}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`scores.${index}.marks`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="number" placeholder="Score" {...inputField} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`scores.${index}.grade`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input placeholder="Grade" {...inputField} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isLoading && <p className="text-sm text-muted-foreground">Loading subjects...</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => form.reset()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || isLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Results
                    </Button>
                </CardFooter>
            </form>
        </Form>
    )
}

function ReportCardForm({ students, terms, studentOptions, isLoading }: any) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const ikUploadRef = React.useRef<any>(null);

    const form = useForm<z.infer<typeof reportCardSchema>>({
        resolver: zodResolver(reportCardSchema),
        defaultValues: { studentId: '', termId: '', imageUrl: '' },
    });

    React.useEffect(() => {
        if (photoUrl) form.setValue('imageUrl', photoUrl);
    }, [photoUrl, form]);

    const onUploadSuccess = (ikResponse: any) => {
        setPhotoUrl(ikResponse.url);
        toast({ title: 'Upload Successful', description: 'Your result sheet has been uploaded.' });
        setIsUploading(false);
    };

    const onUploadError = (err: any) => {
        toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
        setIsUploading(false);
    };

    const onSubmit = async (values: z.infer<typeof reportCardSchema>) => {
        if (!user || !firestore) return;
        const selectedChild = students?.find(c => c.id === values.studentId);
        if (!selectedChild) return;
        setIsSubmitting(true);

        try {
            await addDoc(collection(firestore, 'reportCards'), {
                ...values,
                studentName: selectedChild.fullName,
                branchId: selectedChild.branchId,
                uploadedBy: user.uid,
                uploadedAt: serverTimestamp(),
            });
            toast({ title: 'Report Card Submitted', description: 'The result sheet has been saved.' });
            form.reset();
            setPhotoUrl('');
            router.push('/dashboard');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
                                <UploadCloud className="h-12 w-12 text-muted-foreground" />
                                <FormLabel className="font-semibold">
                                    {photoUrl ? 'Result Sheet Uploaded!' : 'Click to Upload Result Sheet'}
                                </FormLabel>
                                <FormControl>
                                    <IKContext
                                        publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                                        urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                                        authenticator={imageKitAuthenticator}
                                    >
                                        <IKUpload
                                            ref={ikUploadRef}
                                            fileName={`reportcard_${user?.uid}_${Date.now()}.jpg`}
                                            folder="/results"
                                            onUploadStart={() => setIsUploading(true)}
                                            onSuccess={onUploadSuccess}
                                            onError={onUploadError}
                                            style={{ display: 'none' }}
                                        />
                                        <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>
                                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isUploading ? 'Uploading...' : (photoUrl ? 'Change File' : 'Choose File')}
                                        </Button>
                                    </IKContext>
                                </FormControl>
                                {photoUrl && <Image src={photoUrl} alt="Result preview" width={120} height={160} className="rounded-md object-cover border"/>}
                                <FormMessage />
                            </FormItem>
                        )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Student</FormLabel>
                                <FormControl>
                                    <Combobox
                                        options={studentOptions}
                                        onSelect={field.onChange}
                                        placeholder="Select student..."
                                        searchText="Search for a student..."
                                        disabled={isLoading}
                                        value={field.value}
                                        />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="termId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Term</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a term" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {terms?.map(term => (
                                        <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Report Card
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function ParentResultsView() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const childrenQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    }, [user, firestore]);
    const { data: children, isLoading: childrenLoading } = useCollection<Student>(childrenQuery);
    const childIds = useMemo(() => children?.map(c => c.id) || [], [children]);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || childIds.length === 0) return null;
        return query(
            collection(firestore, 'results'),
            where('studentId', 'in', childIds),
            orderBy('recordedAt', 'desc')
        );
    }, [firestore, childIds]);
    const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);
    
    const resultsByChildAndTerm = useMemo(() => {
        if (!results) return {};
        return results.reduce((acc, result) => {
            const childName = result.studentName;
            const termName = result.termName;
            if (!acc[childName]) {
                acc[childName] = {};
            }
            if (!acc[childName][termName]) {
                acc[childName][termName] = [];
            }
            acc[childName][termName].push(result);
            return acc;
        }, {} as Record<string, Record<string, Result[]>>);

    }, [results]);

    const getGrade = (marks: number) => {
        if (marks >= 90) return { grade: 'A+', color: 'bg-green-500' };
        if (marks >= 80) return { grade: 'A', color: 'bg-green-400' };
        if (marks >= 70) return { grade: 'B', color: 'bg-blue-400' };
        if (marks >= 60) return { grade: 'C', color: 'bg-yellow-400' };
        if (marks >= 50) return { grade: 'D', color: 'bg-orange-400' };
        return { grade: 'F', color: 'bg-red-500' };
    }

    const isLoading = childrenLoading || resultsLoading;

    if (isLoading) {
        return (
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </CardContent>
        )
    }

    return (
        <CardContent>
            {Object.keys(resultsByChildAndTerm).length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-4">
                    {Object.entries(resultsByChildAndTerm).map(([childName, terms]) => (
                        <AccordionItem key={childName} value={childName} className="border rounded-lg px-4 bg-background">
                             <AccordionTrigger className="text-xl font-semibold text-primary-deep">{childName}</AccordionTrigger>
                             <AccordionContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {Object.entries(terms).map(([termName, termResults]) => (
                                        <AccordionItem key={termName} value={termName}>
                                            <AccordionTrigger className="text-lg font-semibold">{termName}</AccordionTrigger>
                                            <AccordionContent>
                                                <ul className="space-y-3">
                                                    {termResults.map(result => (
                                                        <li key={result.id} className="flex justify-between items-center p-3 rounded-md bg-secondary/50">
                                                            <span className="font-medium">{result.subjectName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-lg">{result.marks}</span>
                                                                <Badge className={`${getGrade(result.marks).color} text-white w-10 h-6 flex items-center justify-center`}>
                                                                    {getGrade(result.marks).grade}
                                                                </Badge>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-center text-muted-foreground h-24 flex items-center justify-center">No results have been recorded for your children yet.</p>
            )}
        </CardContent>
    )

}

async function seedInitialData(db: any) {
    const termsRef = collection(db, 'terms');
    const subjectsRef = collection(db, 'subjects');
    const termsSnapshot = await getDocs(termsRef);
    const subjectsSnapshot = await getDocs(subjectsRef);
    const batch = writeBatch(db);
    let seeded = false;

    if (termsSnapshot.empty) {
        const termsData = [
            { id: 'term-1-2425', name: 'First Term 2024/2025' },
            { id: 'term-2-2425', name: 'Second Term 2024/2025' },
            { id: 'term-3-2425', name: 'Third Term 2024/2025' },
        ];
        termsData.forEach(term => batch.set(doc(db, 'terms', term.id), term));
        seeded = true;
    }

    if (subjectsSnapshot.empty) {
        const subjectsData = [
            { id: 'math', name: 'Mathematics', category: 'core' },
            { id: 'eng', name: 'English Language', category: 'core' },
            { id: 'quran', name: 'Quran Memorization', category: 'islamic' },
            { id: 'hadith', name: 'Hadith Studies', category: 'islamic' },
            { id: 'arabic', name: 'Arabic Language', category: 'islamic' },
            { id: 'bsc', name: 'Basic Science', category: 'core' },
        ];
        subjectsData.forEach(sub => batch.set(doc(db, 'subjects', sub.id), sub));
        seeded = true;
    }
    
    if (seeded) {
        await batch.commit();
        return true;
    }
    return false;
}


export default function ResultsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (firestore) {
      seedInitialData(firestore).then(seeded => {
        if (seeded) setDataVersion(v => v + 1);
      });
    }
  }, [firestore]);
  
  const handleDataChange = () => setDataVersion(v => v + 1);

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    if (user.role === 'super_admin') return collection(firestore, 'students');
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user, firestore]);

  const termsQuery = useMemoFirebase(() => dataVersion >= 0 && firestore ? collection(firestore, 'terms') : null, [firestore, dataVersion]);
  const subjectsQuery = useMemoFirebase(() => dataVersion >= 0 && firestore ? query(collection(firestore, 'subjects'), orderBy('name')) : null, [firestore, dataVersion]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: terms, isLoading: termsLoading } = useCollection<Term>(termsQuery);
  const { data: subjects, isLoading: subjectsLoading } = useCollection<Subject>(subjectsQuery);
  
  const studentOptions = students?.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` })) || [];
  const isLoading = studentsLoading || termsLoading || subjectsLoading;

  if (user?.role === 'parent') {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Children's Academic Results</CardTitle>
                <CardDescription>A summary of academic performance for your children.</CardDescription>
            </CardHeader>
            <ParentResultsView />
        </Card>
      );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Student Results</CardTitle>
        <CardDescription>Select a format for entering results below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scores">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scores">Enter Scores by Subject</TabsTrigger>
            <TabsTrigger value="upload">Upload Result Sheet</TabsTrigger>
          </TabsList>
          <TabsContent value="scores" className="mt-4">
              <ScoresForm 
                 students={students}
                 terms={terms}
                 subjects={subjects}
                 studentOptions={studentOptions}
                 isLoading={isLoading}
                 onDataChange={handleDataChange}
              />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
              <ReportCardForm 
                 students={students}
                 terms={terms}
                 studentOptions={studentOptions}
                 isLoading={isLoading}
              />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
