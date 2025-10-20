
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, query, where, writeBatch, doc, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import type { Student } from '../students/student-table';

const resultSchema = z.object({
  studentId: z.string().min(1, 'Please select a student.'),
  termId: z.string().min(1, 'Please select a term.'),
  scores: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    marks: z.coerce.number().min(0, 'Marks must be positive.').max(100, 'Marks cannot exceed 100.'),
  })),
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const form = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentId: '',
      termId: '',
      scores: [],
    },
  });
  
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "scores",
  });


  useEffect(() => {
    if (firestore) {
      seedInitialData(firestore).then(seeded => {
        if (seeded) setDataVersion(v => v + 1);
      });
    }
  }, [firestore]);

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    if (user.role === 'super_admin') {
      return collection(firestore, 'students');
    }
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user?.uid, user?.role, user?.branchId, firestore]);

  const termsQuery = useMemoFirebase(() => dataVersion >= 0 && firestore ? collection(firestore, 'terms') : null, [firestore, dataVersion]);
  const subjectsQuery = useMemoFirebase(() => dataVersion >= 0 && firestore ? collection(firestore, 'subjects') : null, [firestore, dataVersion]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: terms, isLoading: termsLoading } = useCollection<Term>(termsQuery);
  const { data: subjects, isLoading: subjectsLoading } = useCollection<Subject>(subjectsQuery);

  useEffect(() => {
    if (subjects) {
      const scores = subjects.map(subject => ({
        subjectId: subject.id,
        subjectName: subject.name,
        marks: 0,
      }));
      replace(scores);
    }
  }, [subjects, replace]);


  async function onSubmit(values: z.infer<typeof resultSchema>) {
    if (!user || !firestore) return;
    setIsLoading(true);

    const batch = writeBatch(firestore);
    const termName = terms?.find(t => t.id === values.termId)?.name || 'Unknown Term';
    const studentName = students?.find(s => s.id === values.studentId)?.fullName || 'Unknown Student';

    values.scores.forEach(score => {
      const resultId = `${values.studentId}_${values.termId}_${score.subjectId}`;
      const resultDocRef = doc(firestore, 'results', resultId);
      batch.set(resultDocRef, {
        studentId: values.studentId,
        termId: values.termId,
        subjectId: score.subjectId,
        branchId: user.branchId,
        marks: score.marks,
        recordedBy: user.uid,
        recordedAt: new Date(),
        studentName, // denormalized
        termName, // denormalized
        subjectName: score.subjectName // denormalized
      });
    });

    try {
      await batch.commit();
      toast({
        title: 'Results Saved',
        description: `Successfully saved results for ${studentName}.`,
      });
      form.reset();
      const scores = subjects?.map(subject => ({ subjectId: subject.id, subjectName: subject.name, marks: 0 })) || [];
      replace(scores);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Save Results',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const studentOptions = students?.map(s => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` })) || [];

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Enter Student Results</CardTitle>
          <CardDescription>
            Select a student and term, then enter their marks for each subject.
          </CardDescription>
        </CardHeader>
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
                          disabled={studentsLoading}
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={termsLoading}>
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
                <h3 className="font-medium">Enter Scores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {fields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`scores.${index}.marks`}
                            render={({ field: inputField }) => (
                                <FormItem>
                                    <FormLabel>{field.subjectName}</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter marks (0-100)" {...inputField} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
                 {subjectsLoading && <p className="text-sm text-muted-foreground">Loading subjects...</p>}
            </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => form.reset()}>Cancel</Button>
            <Button type="submit" disabled={isLoading || subjectsLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Results
            </Button>
        </CardFooter>
        </form>
        </Form>
      </Card>
    </div>
  );
}
