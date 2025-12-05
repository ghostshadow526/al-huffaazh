
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, writeBatch, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Student } from '../students/student-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Trash2, GraduationCap, PlusCircle, MinusCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// --- Data Schemas and Interfaces ---

const subjectResultSchema = z.object({
  subject_name: z.string().min(1, 'Subject name is required.'),
  ca_score: z.coerce.number().min(0).max(40).optional().default(0),
  exam_score: z.coerce.number().min(0).max(60).optional().default(0),
  total_score: z.coerce.number().min(0).max(100).optional().default(0),
  grade: z.string().optional().default(''),
});

const bulkResultsSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  termId: z.string().min(1, 'Term is required.'),
  results: z.array(subjectResultSchema).min(1, 'At least one subject is required.'),
  position: z.string().optional(),
});

interface Result {
  id: string;
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  subject_name: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  position?: string;
}

interface Term {
  id: string;
  name: string;
}

const getGrade = (marks: number): string => {
  if (marks >= 75) return 'A';
  if (marks >= 65) return 'B';
  if (marks >= 55) return 'C';
  if (marks >= 45) return 'D';
  if (marks >= 40) return 'E';
  return 'F';
};


// --- Child Components ---
function BulkResultEntryForm({ students, terms, onResultAdded }: { students: Student[], terms: Term[], onResultAdded: () => void }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof bulkResultsSchema>>({
        resolver: zodResolver(bulkResultsSchema),
        defaultValues: {
            studentId: '',
            termId: '',
            results: [{ subject_name: 'English Language', ca_score: 0, exam_score: 0 }],
            position: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'results',
    });

    const watchedResults = useWatch({ control: form.control, name: 'results' });

    useEffect(() => {
        watchedResults.forEach((result, index) => {
            const ca = result.ca_score || 0;
            const exam = result.exam_score || 0;
            const total = ca + exam;
            if (result.total_score !== total) {
                form.setValue(`results.${index}.total_score`, total);
                form.setValue(`results.${index}.grade`, getGrade(total));
            }
        });
    }, [watchedResults, form]);

    const overallTotal = useMemo(() => {
        return watchedResults.reduce((sum, result) => sum + (result.total_score || 0), 0);
    }, [watchedResults]);

    const overallAverage = useMemo(() => {
        if (!watchedResults) return 0;
        const validSubjects = watchedResults.filter(r => r.subject_name && r.total_score != null && r.total_score > 0);
        if (validSubjects.length === 0) return 0;
        const total = validSubjects.reduce((sum, result) => sum + (result.total_score || 0), 0);
        return total / validSubjects.length;
    }, [watchedResults]);

    const onSubmit = async (values: z.infer<typeof bulkResultsSchema>) => {
        if (!user || !firestore) return;
        setIsSubmitting(true);
        
        const student = students.find(s => s.id === values.studentId);
        const term = terms.find(t => t.id === values.termId);

        if (!student || !term) {
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid student or term selected.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const batch = writeBatch(firestore);

            values.results.forEach(result => {
                if (result.subject_name) {
                    const resultId = `${values.studentId}_${values.termId}_${result.subject_name.toLowerCase().replace(/\s/g, '_')}`;
                    const resultRef = doc(firestore, 'results', resultId);
                    batch.set(resultRef, {
                        studentId: values.studentId,
                        studentName: student.fullName,
                        termId: values.termId,
                        termName: term.name,
                        branchId: student.branchId,
                        subject_name: result.subject_name,
                        ca_score: result.ca_score || 0,
                        exam_score: result.exam_score || 0,
                        total_score: result.total_score || 0,
                        grade: getGrade(result.total_score || 0),
                        position: values.position || '',
                        recordedBy: user.uid,
                        recordedAt: serverTimestamp(),
                    });
                }
            });

            await batch.commit();

            toast({ title: 'Success', description: 'All results have been saved.' });
            form.reset();
            onResultAdded();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to save results', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const studentOptions = students.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));
    const termOptions = terms.map(t => ({ value: t.id, label: t.name }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Student &amp; Term</CardTitle>
                        <CardDescription>Select the student and the academic term for these results.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="studentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Student</FormLabel>
                                <Combobox options={studentOptions} onSelect={field.onChange} placeholder="Select student..." searchText="Search students..." />
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="termId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Term</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>{termOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enter Scores</CardTitle>
                        <CardDescription>Add subjects and enter the scores for each. Totals and grades are calculated automatically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/3">Subject Name</TableHead>
                                    <TableHead>CA/Test (40)</TableHead>
                                    <TableHead>Exam (60)</TableHead>
                                    <TableHead>Total (100)</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField control={form.control} name={`results.${index}.subject_name`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} placeholder="e.g. Mathematics" /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField control={form.control} name={`results.${index}.ca_score`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField control={form.control} name={`results.${index}.exam_score`} render={({ field }) => (
                                                <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`results.${index}.total_score`)} readOnly className="bg-muted" />
                                        </TableCell>
                                        <TableCell>
                                            <Input {...form.register(`results.${index}.grade`)} readOnly className="bg-muted font-bold text-center" />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                                <MinusCircle className="h-5 w-5 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <Button type="button" variant="outline" size="sm" onClick={() => append({ subject_name: '', ca_score: 0, exam_score: 0 })} className="mt-4" disabled={fields.length >= 15}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Overall Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormItem>
                            <FormLabel>Total Marks</FormLabel>
                            <Input value={(overallTotal || 0).toFixed(2)} readOnly className="bg-muted font-bold" />
                        </FormItem>
                        <FormItem>
                            <FormLabel>Average (%)</FormLabel>
                            <Input value={(overallAverage || 0).toFixed(2)} readOnly className="bg-muted font-bold" />
                        </FormItem>
                         <FormItem>
                            <FormLabel>Overall Grade</FormLabel>
                            <Input value={getGrade(overallAverage)} readOnly className="bg-muted font-bold" />
                        </FormItem>
                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Position in Class</FormLabel>
                                <FormControl><Input placeholder="e.g., 1st, 2nd, 3rd" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSubmitting} size="lg">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save All Results
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}


function ChildResults({ child, terms }: { child: Student, terms: Term[] }) {
    const firestore = useFirestore();

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'results'), where('studentId', '==', child.id));
    }, [firestore, child.id]);

    const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);

    if (resultsLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    const resultsByTerm = results?.reduce((acc, result) => {
        const termName = result.termName || 'Unknown Term';
        if (!acc[termName]) {
            acc[termName] = [];
        }
        acc[termName].push(result);
        return acc;
    }, {} as Record<string, Result[]>) || {};
    
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
                    <div className="p-6 space-y-8">
                       {Object.keys(resultsByTerm).length > 0 ? (
                           Object.entries(resultsByTerm).map(([termName, termResults]) => {
                             const totalMarks = termResults.reduce((sum, r) => sum + r.total_score, 0);
                             const average = totalMarks / termResults.length;
                             const position = termResults[0]?.position || 'N/A'; // Assuming position is same for all results in a term

                               return (
                                <div key={termName} className="mb-8 last:mb-0">
                                    <h4 className="font-bold text-lg mb-4 border-b pb-2">{termName}</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>CA (40)</TableHead>
                                                <TableHead>Exam (60)</TableHead>
                                                <TableHead>Total (100)</TableHead>
                                                <TableHead>Grade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {termResults.map(r => (
                                                <TableRow key={r.id}>
                                                    <TableCell>{r.subject_name}</TableCell>
                                                    <TableCell>{r.ca_score}</TableCell>
                                                    <TableCell>{r.exam_score}</TableCell>
                                                    <TableCell>{r.total_score}</TableCell>
                                                    <TableCell>{r.grade}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                                        <div className="p-2 bg-muted rounded-md">Total: <span className="font-bold">{totalMarks.toFixed(2)}</span></div>
                                        <div className="p-2 bg-muted rounded-md">Average: <span className="font-bold">{average.toFixed(2)}%</span></div>
                                        <div className="p-2 bg-muted rounded-md">Overall Grade: <span className="font-bold">{getGrade(average)}</span></div>
                                        <div className="p-2 bg-muted rounded-md">Position: <span className="font-bold">{position}</span></div>
                                    </div>
                                </div>
                               )
                           })
                       ) : (
                         <p className="text-muted-foreground text-center py-8">No results have been uploaded for {child.fullName} yet.</p>
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
  const [dataVersion, setDataVersion] = useState(0); 

  useEffect(() => {
    if (!firestore || user?.role === 'parent') return;

    const seedTerms = async () => {
      const termsRef = collection(firestore, 'terms');
      const termSnap = await getDocs(termsRef);
      if (termSnap.empty) {
        const batch = writeBatch(firestore);
        const termsData = [
          { id: 't1-24-25', name: 'First Term 2024/2025' },
          { id: 't2-24-25', name: 'Second Term 2024/2025' },
          { id: 't3-24-25', name: 'Third Term 2024/2025' },
        ];
        termsData.forEach(t => batch.set(doc(termsRef, t.id), t));
        await batch.commit();
        setDataVersion(v => v + 1);
      }
    };
    seedTerms();
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

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: termsData, isLoading: termsLoading } = useCollection<Term>(termsQuery);
  
  if (!user) return <p>Loading...</p>;

  const handleNewResult = () => setDataVersion(v => v + 1);

  const isDataLoading = studentsLoading || termsLoading;
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
        isDataLoading ? <Skeleton className="h-64 w-full" /> : <ParentResultsView children={students || []} terms={termsData || []} />
      ) : (
         isDataLoading ? <Skeleton className="h-96 w-full" /> : <BulkResultEntryForm students={students || []} terms={termsData || []} onResultAdded={handleNewResult} />
      )}
    </div>
  );
}

    