
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, writeBatch, doc, getDocs, serverTimestamp, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IKContext, IKUpload } from 'imagekitio-react';
import Image from 'next/image';

import type { Student } from '../students/student-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, UploadCloud, PlusCircle, Check, Trash2, GraduationCap } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Data Schemas and Interfaces ---

const resultSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  termId: z.string().min(1, 'Term is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  marks: z.coerce.number().min(0, 'Marks must be positive.').max(100, 'Marks cannot exceed 100.'),
});

const reportCardSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  termId: z.string().min(1, 'Term is required.'),
  imageUrl: z.string().url('Report card image is required.'),
});

const newSubjectSchema = z.object({
    name: z.string().min(3, "Subject name must be at least 3 characters."),
    category: z.enum(['core', 'islamic', 'general']),
});

interface Result {
  id: string;
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  subjectId: string;
  subjectName: string;
  marks: number;
  grade: string;
}

interface Term {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  category: string;
}

const getGrade = (marks: number): string => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  if (marks >= 40) return 'E';
  return 'F';
};


const imageKitAuthenticator = async () => {
    const response = await fetch('/api/imagekit/auth');
    const result = await response.json();
    return result;
};


// --- Child Components ---

function ResultEntryForm({ students, terms, subjects, onResultAdded, onSubjectAdded }: { students: Student[], terms: Term[], subjects: Subject[], onResultAdded: () => void, onSubjectAdded: (newSubject: Subject) => void }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);

  const form = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: { studentId: '', termId: '', subjectId: '', marks: 0 },
  });
  
  const newSubjectForm = useForm<z.infer<typeof newSubjectSchema>>({
      resolver: zodResolver(newSubjectSchema),
      defaultValues: { name: "", category: 'general' }
  });

  const onSubmit = async (values: z.infer<typeof resultSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);
    
    const student = students.find(s => s.id === values.studentId);
    const term = terms.find(t => t.id === values.termId);
    const subject = subjects.find(s => s.id === values.subjectId);

    if (!student || !term || !subject) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid student, term, or subject selected.' });
        setIsSubmitting(false);
        return;
    }

    try {
      const resultId = `${values.studentId}_${values.termId}_${values.subjectId}`;
      const resultRef = doc(firestore, 'results', resultId);

      await setDoc(resultRef, {
        ...values,
        grade: getGrade(values.marks),
        studentName: student.fullName,
        termName: term.name,
        subjectName: subject.name,
        branchId: student.branchId,
        recordedBy: user.uid,
        recordedAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: 'Success', description: 'Result has been saved.' });
      form.reset();
      onResultAdded();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save result', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewSubject = async (values: z.infer<typeof newSubjectSchema>) => {
      if (!firestore) return;
      
      const newSubjectId = values.name.toLowerCase().replace(/ /g, '-');
      const subjectRef = doc(firestore, 'subjects', newSubjectId);
      
      const newSubject: Subject = {
          id: newSubjectId,
          name: values.name,
          category: values.category
      };

      try {
          await setDoc(subjectRef, newSubject);
          toast({ title: "Subject Added", description: `${values.name} has been added to the list.`});
          onSubjectAdded(newSubject);
          newSubjectForm.reset();
          setShowNewSubjectDialog(false);
      } catch (error: any) {
           toast({ variant: 'destructive', title: 'Failed to add subject', description: error.message });
      }
  }

  const studentOptions = students.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));
  const termOptions = terms.map(t => ({ value: t.id, label: t.name }));
  const subjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem>
                <Label>Student</Label>
                <Combobox options={studentOptions} onSelect={field.onChange} placeholder="Select student..." searchText="Search students..."/>
                {form.formState.errors.studentId && <p className="text-sm font-medium text-destructive">{form.formState.errors.studentId.message}</p>}
              </FormItem>
            )}/>
            <FormField control={form.control} name="termId" render={({ field }) => (
              <FormItem>
                <Label>Term</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>{termOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                 {form.formState.errors.termId && <p className="text-sm font-medium text-destructive">{form.formState.errors.termId.message}</p>}
              </FormItem>
            )}/>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-end">
              <FormField control={form.control} name="subjectId" render={({ field }) => (
                <FormItem>
                    <Label>Subject</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{subjectOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {form.formState.errors.subjectId && <p className="text-sm font-medium text-destructive">{form.formState.errors.subjectId.message}</p>}
                </FormItem>
                )}/>
                 <Button type="button" variant="outline" onClick={() => setShowNewSubjectDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Subject
                </Button>
          </div>

          <FormField control={form.control} name="marks" render={({ field }) => (
            <FormItem>
              <Label>Marks Obtained (out of 100)</Label>
              <Input type="number" {...field} />
              {form.formState.errors.marks && <p className="text-sm font-medium text-destructive">{form.formState.errors.marks.message}</p>}
            </FormItem>
          )}/>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Result
          </Button>
        </form>
      </Form>
    </>
  );
}

function ReportCardUploadForm({ students, terms }: { students: Student[], terms: Term[]}) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = React.useRef<any>(null);

  const form = useForm<z.infer<typeof reportCardSchema>>({
    resolver: zodResolver(reportCardSchema),
    defaultValues: { studentId: '', termId: '', imageUrl: '' },
  });

  useEffect(() => {
    if (photoUrl) form.setValue('imageUrl', photoUrl);
  }, [photoUrl, form]);

  const onUploadSuccess = (ikResponse: any) => {
    setPhotoUrl(ikResponse.url);
    toast({ title: 'Upload Successful', description: 'Report card image uploaded.' });
    setIsUploading(false);
  };
  const onUploadError = (err: any) => {
    toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    setIsUploading(false);
  };

  const onSubmit = async (values: z.infer<typeof reportCardSchema>) => {
    if (!user || !firestore) return;
    const student = students.find(s => s.id === values.studentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'reportCards'), {
        ...values,
        studentName: student.fullName,
        branchId: student.branchId,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Report card has been saved.' });
      form.reset();
      setPhotoUrl('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to save report card', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentOptions = students.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));
  const termOptions = terms.map(t => ({ value: t.id, label: t.name }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <Label className="font-semibold">{photoUrl ? 'Report Uploaded!' : 'Click to Upload Report Card'}</Label>
            <IKContext publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY} urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT} authenticator={imageKitAuthenticator}>
              <IKUpload ref={ikUploadRef} fileName={`report_${form.getValues('studentId') || 'student'}.jpg`} folder="/reports" onUploadStart={() => setIsUploading(true)} onSuccess={onUploadSuccess} onError={onUploadError} style={{ display: 'none' }} />
              <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>{isUploading ? 'Uploading...' : (photoUrl ? 'Change File' : 'Choose File')}</Button>
            </IKContext>
            {photoUrl && <Image src={photoUrl} alt="Report preview" width={120} height={150} className="rounded-md object-contain border p-1" />}
             {form.formState.errors.imageUrl && <p className="text-sm font-medium text-destructive">{form.formState.errors.imageUrl.message}</p>}
          </FormItem>
        )}/>
        <div className="grid md:grid-cols-2 gap-6">
           <FormField control={form.control} name="studentId" render={({ field }) => (
              <FormItem>
                <Label>Student</Label>
                <Combobox options={studentOptions} onSelect={field.onChange} placeholder="Select student..." searchText="Search students..."/>
                {form.formState.errors.studentId && <p className="text-sm font-medium text-destructive">{form.formState.errors.studentId.message}</p>}
              </FormItem>
            )}/>
            <FormField control={form.control} name="termId" render={({ field }) => (
              <FormItem>
                <Label>Term</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>{termOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                 {form.formState.errors.termId && <p className="text-sm font-medium text-destructive">{form.formState.errors.termId.message}</p>}
              </FormItem>
            )}/>
        </div>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Report Card
        </Button>
      </form>
    </Form>
  );
}


function TeacherAdminView({ students, terms, subjects, onResultAdded, onSubjectAdded, isLoading }: { students: Student[], terms: Term[], subjects: Subject[], onResultAdded: () => void, onSubjectAdded: (newSubject: Subject) => void, isLoading: boolean }) {
    if (isLoading) {
        return <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
    }

  return (
    <Tabs defaultValue="enter-scores">
      <TabsList>
        <TabsTrigger value="enter-scores">Enter Individual Scores</TabsTrigger>
        <TabsTrigger value="upload-report">Upload Full Report Card</TabsTrigger>
      </TabsList>
      <TabsContent value="enter-scores">
        <Card>
          <CardHeader><CardTitle>Enter Student Scores</CardTitle><CardDescription>Enter results for a single subject and student.</CardDescription></CardHeader>
          <CardContent><ResultEntryForm students={students} terms={terms} subjects={subjects} onResultAdded={onResultAdded} onSubjectAdded={onSubjectAdded} /></CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="upload-report">
        <Card>
          <CardHeader><CardTitle>Upload Report Card</CardTitle><CardDescription>Upload a scanned image of the full termly report card.</CardDescription></CardHeader>
          <CardContent><ReportCardUploadForm students={students} terms={terms} /></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ChildResults({ child, terms }: { child: Student, terms: Term[] }) {
    const firestore = useFirestore();

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'results'), where('studentId', '==', child.id));
    }, [firestore, child.id]);

    const reportCardsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'reportCards'), where('studentId', '==', child.id));
    }, [firestore, child.id]);

    const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);
    const { data: reportCards, isLoading: reportCardsLoading } = useCollection<{ id: string; termId: string; imageUrl: string }>(reportCardsQuery);

    const isLoading = resultsLoading || reportCardsLoading;

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />
    }

    return (
        <AccordionItem value={child.id} key={child.id} className="border-b-0">
            <Card className="overflow-hidden">
                <AccordionTrigger className="p-6 hover:no-underline bg-muted/50">
                    <div className="flex items-center gap-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <p className="font-semibold text-lg">{child.fullName}</p>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <div className="p-6">
                        {terms.map(term => {
                            const termResults = results?.filter(r => r.termId === term.id) || [];
                            const termReportCard = reportCards?.find(rc => rc.termId === term.id);

                            if (termResults.length === 0 && !termReportCard) return null;

                            return (
                                <div key={term.id} className="mb-8 last:mb-0">
                                    <h4 className="font-bold text-lg mb-2 border-b pb-2">{term.name}</h4>
                                    {termResults.length > 0 && (
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {termResults.map(r => (
                                                    <TableRow key={r.id}><TableCell>{r.subjectName}</TableCell><TableCell>{r.marks}</TableCell><TableCell>{r.grade}</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                    {termReportCard && (
                                        <div className="mt-4">
                                            <h5 className="font-semibold mb-2">Full Report Card</h5>
                                            <Button asChild variant="outline">
                                                <a href={termReportCard.imageUrl} target="_blank" rel="noopener noreferrer">View Uploaded Report</a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {results?.length === 0 && reportCards?.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">No results or report cards have been uploaded for {child.fullName} yet.</p>
                        )}
                    </div>
                </AccordionContent>
            </Card>
        </AccordionItem>
    );
}


function ParentResultsView({ children, terms }: { children: Student[], terms: Term[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Children's Results</CardTitle>
                <CardDescription>View academic performance for your children.</CardDescription>
            </CardHeader>
            <CardContent>
                {children.length === 0 && <p className="text-muted-foreground">You do not have any children linked to this account.</p>}
                <Accordion type="multiple" className="w-full space-y-4">
                    {children.map(child => (
                        <ChildResults key={child.id} child={child} terms={terms} />
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---

export default function ResultsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [dataVersion, setDataVersion] = useState(0); // To force re-fetch

  // Seed data effect
  useEffect(() => {
    if (!firestore || user?.role === 'parent') return;

    const seedData = async () => {
      const batch = writeBatch(firestore);
      const termsRef = collection(firestore, 'terms');
      const subjectsRef = collection(firestore, 'subjects');

      const termSnap = await getDocs(termsRef);
      if (termSnap.empty) {
        const termsData = [
          { id: 't1-24-25', name: 'First Term 2024/2025' },
          { id: 't2-24-25', name: 'Second Term 2024/2025' },
          { id: 't3-24-25', name: 'Third Term 2024/2025' },
        ];
        termsData.forEach(t => batch.set(doc(termsRef, t.id), t));
      }

      const subjectSnap = await getDocs(subjectsRef);
      if (subjectSnap.empty) {
        const subjectsData = [
          { id: 'math', name: 'Mathematics', category: 'core' },
          { id: 'eng', name: 'English Language', category: 'core' },
          { id: 'quran', name: 'Quran Memorization', category: 'islamic' },
        ];
        subjectsData.forEach(s => batch.set(doc(subjectsRef, s.id), s));
      }

      await batch.commit();
      setDataVersion(v => v + 1); // Trigger data refresh
    };

    seedData();
  }, [firestore, user?.role]);

  // Data fetching hooks
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (user.role === 'parent') return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    if (user.role === 'super_admin') return collection(firestore, 'students');
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    return null;
  }, [user, firestore]);

  const termsQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return collection(firestore, 'terms')
  }, [firestore, dataVersion]);

  const subjectsQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'subjects')
  }, [firestore, dataVersion]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: termsData, isLoading: termsLoading } = useCollection<Term>(termsQuery);
  const { data: subjectsData, isLoading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

  const [subjects, setSubjects] = useState<Subject[]>(subjectsData || []);
  useEffect(() => {
      if(subjectsData) setSubjects(subjectsData);
  }, [subjectsData]);

  if (!user) return <p>Loading...</p>;

  const handleNewSubject = (newSubject: Subject) => {
    setSubjects(prev => [...prev, newSubject]);
  };
  
  const handleNewResult = () => {
    setDataVersion(v => v + 1);
  }

  const isDataLoading = studentsLoading || termsLoading || subjectsLoading;
  const isParent = user.role === 'parent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Results</h2>
          <p className="text-muted-foreground">
            {isParent ? "View your children's performance" : 'Manage student scores and report cards.'}
          </p>
        </div>
      </div>
      
       {isParent ? (
        <ParentResultsView children={students || []} terms={termsData || []} />
      ) : (
        <TeacherAdminView 
            students={students || []} 
            terms={termsData || []} 
            subjects={subjects || []}
            onResultAdded={handleNewResult}
            onSubjectAdded={handleNewSubject}
            isLoading={isDataLoading}
        />
      )}
    </div>
  );
}

    