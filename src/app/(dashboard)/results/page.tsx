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
import { Loader2, Trash2, GraduationCap, PlusCircle, MinusCircle, Smartphone, Monitor, BookOpen } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// --- Data Schemas and Interfaces ---

const subjectResultSchema = z.object({
  subject_name: z.string().min(1, 'Subject name is required.'),
  ca_score: z.coerce.number().min(0, 'Must be at least 0').max(20, 'Max 20').optional().default(0),
  assignment_score: z.coerce.number().min(0, 'Must be at least 0').max(20, 'Max 20').optional().default(0),
  exam_score: z.coerce.number().min(0, 'Must be at least 0').max(60, 'Max 60').optional().default(0),
  total_score: z.coerce.number().min(0).optional().default(0),
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
  assignment_score: number;
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

const getGradeColorClass = (grade: string) => {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
    case 'D':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
    case 'E':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
    case 'F':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const DEFAULT_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Arabic / Islamic Studies',
  'Basic Science',
  'Social Studies',
  'Hausa Language',
];

// --- Child Components ---
function BulkResultEntryForm({
  students,
  terms,
  onResultAdded,
}: {
  students: Student[];
  terms: Term[];
  onResultAdded: () => void;
}) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Screen detection hook
  const isMobileScreen = useIsMobile();
  // View mode preference: user can allow auto-detection or manually force cards vs table
  const [userViewMode, setUserViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Resolved view mode based on screen detection
  const isCardView = userViewMode === 'cards' || (userViewMode === 'auto' && isMobileScreen);

  const form = useForm<z.infer<typeof bulkResultsSchema>>({
    resolver: zodResolver(bulkResultsSchema),
    defaultValues: {
      studentId: '',
      termId: '',
      results: [
        { subject_name: 'English Language', ca_score: 0, assignment_score: 0, exam_score: 0, total_score: 0, grade: 'F' },
        { subject_name: 'Mathematics', ca_score: 0, assignment_score: 0, exam_score: 0, total_score: 0, grade: 'F' },
      ],
      position: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'results',
  });

  const watchedResults = useWatch({ control: form.control, name: 'results' });

  // Recalculate totals and grades automatically when scores change
  useEffect(() => {
    watchedResults?.forEach((result, index) => {
      const ca = Number(result?.ca_score) || 0;
      const assignment = Number(result?.assignment_score) || 0;
      const exam = Number(result?.exam_score) || 0;
      const total = ca + assignment + exam;
      const calculatedGrade = getGrade(total);

      if (result && (result.total_score !== total || result.grade !== calculatedGrade)) {
        form.setValue(`results.${index}.total_score`, total);
        form.setValue(`results.${index}.grade`, calculatedGrade);
      }
    });
  }, [watchedResults, form]);

  const overallTotal = useMemo(() => {
    return (watchedResults || []).reduce((sum, result) => sum + (Number(result?.total_score) || 0), 0);
  }, [watchedResults]);

  const overallAverage = useMemo(() => {
    if (!watchedResults) return 0;
    const validSubjects = watchedResults.filter(
      (r) => r?.subject_name && r.total_score != null && r.total_score >= 0
    );
    if (validSubjects.length === 0) return 0;
    const total = validSubjects.reduce((sum, result) => sum + (Number(result?.total_score) || 0), 0);
    return total / validSubjects.length;
  }, [watchedResults]);

  const onSubmit = async (values: z.infer<typeof bulkResultsSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    const student = students.find((s) => s.id === values.studentId);
    const term = terms.find((t) => t.id === values.termId);

    if (!student || !term) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both a student and an academic term.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);

      values.results.forEach((result) => {
        if (result.subject_name?.trim()) {
          const sanitizedSubject = result.subject_name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
          const resultId = `${values.studentId}_${values.termId}_${sanitizedSubject}`;
          const resultRef = doc(firestore, 'results', resultId);
          batch.set(resultRef, {
            studentId: values.studentId,
            studentName: student.fullName,
            termId: values.termId,
            termName: term.name,
            branchId: student.branchId,
            subject_name: result.subject_name.trim(),
            ca_score: Number(result.ca_score) || 0,
            assignment_score: Number(result.assignment_score) || 0,
            exam_score: Number(result.exam_score) || 0,
            total_score: Number(result.total_score) || 0,
            grade: getGrade(Number(result.total_score) || 0),
            position: values.position || '',
            recordedBy: user.uid,
            recordedAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();

      toast({
        title: 'Scores Saved Successfully',
        description: `Results recorded for ${student.fullName} (${term.name}).`,
      });
      form.reset({
        studentId: '',
        termId: values.termId, // keep term for easy next entry
        results: [
          { subject_name: 'English Language', ca_score: 0, assignment_score: 0, exam_score: 0, total_score: 0, grade: 'F' },
          { subject_name: 'Mathematics', ca_score: 0, assignment_score: 0, exam_score: 0, total_score: 0, grade: 'F' },
        ],
        position: '',
      });
      onResultAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save results',
        description: error.message || 'An error occurred while saving results.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.fullName} (${s.admissionNo}) - ${s.class}`,
  }));
  const termOptions = terms.map((t) => ({ value: t.id, label: t.name }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Student and Term Selection */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              1. Student &amp; Academic Term
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Select the student and the term to record or update examination scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-bold text-foreground">
                    Select Student *
                  </FormLabel>
                  <Combobox
                    options={studentOptions}
                    onSelect={field.onChange}
                    value={field.value}
                    placeholder="Search and select student..."
                    searchText="Search by name, admission no, or class..."
                    className="h-12 sm:h-13 text-base rounded-xl border-2"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-bold text-foreground">
                    Academic Term *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 sm:h-13 text-base rounded-xl border-2 font-medium">
                        <SelectValue placeholder="Choose Academic Term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {termOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-base py-2.5">
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Step 2: Enter Scores (Adaptive Screen-Detected Layout with Increased Box Sizes) */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  2. Enter Subject Scores
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Test (Max 20), Assignment (Max 20), Exam (Max 60). Totals and grades calculate automatically.
                </CardDescription>
              </div>

              {/* View Switcher Controls (Auto detects screen width, but user can also manually toggle) */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto border">
                <button
                  type="button"
                  onClick={() => setUserViewMode('cards')}
                  className={cn(
                    'px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5',
                    isCardView
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Card View (Optimized for Mobile/Touch)"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden xs:inline">Mobile</span> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setUserViewMode('table')}
                  className={cn(
                    'px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5',
                    !isCardView
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Table View (Optimized for Desktop/Wide Screen)"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden xs:inline">Desktop</span> Table
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-6">
            {/* View A: MOBILE CARDS VIEW (When screen is mobile or user toggled cards) */}
            {isCardView ? (
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const currentTotal = watchedResults?.[index]?.total_score || 0;
                  const currentGrade = watchedResults?.[index]?.grade || getGrade(currentTotal);
                  const gradeBadgeStyle = getGradeColorClass(currentGrade);

                  return (
                    <div
                      key={field.id}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-border bg-card/60 shadow-sm space-y-4 transition-all hover:border-primary/40"
                    >
                      {/* Subject Card Header */}
                      <div className="flex items-center justify-between gap-2 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-base text-foreground">
                            Subject #{index + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                          className="h-10 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </Button>
                      </div>

                      {/* Subject Name Input - Extra Large & Touch Friendly */}
                      <div>
                        <FormField
                          control={form.control}
                          name={`results.${index}.subject_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Subject Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. Mathematics, English, Arabic"
                                  className="h-13 text-base sm:text-lg font-semibold rounded-xl border-2 px-4"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Score Boxes Grid - Increased Size for Touch / Screen detection */}
                      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                        <FormField
                          control={form.control}
                          name={`results.${index}.ca_score`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-muted-foreground truncate block text-center">
                                CA/Test (20)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={20}
                                  {...field}
                                  className="h-14 sm:h-13 text-xl sm:text-2xl font-bold text-center rounded-xl border-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`results.${index}.assignment_score`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-muted-foreground truncate block text-center">
                                Assign. (20)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={20}
                                  {...field}
                                  className="h-14 sm:h-13 text-xl sm:text-2xl font-bold text-center rounded-xl border-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`results.${index}.exam_score`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-muted-foreground truncate block text-center">
                                Exam (60)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={60}
                                  {...field}
                                  className="h-14 sm:h-13 text-xl sm:text-2xl font-bold text-center rounded-xl border-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Live Calculated Row (Total & Grade) */}
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1">
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground block text-center mb-1">
                            Total Score (100)
                          </Label>
                          <div className="h-14 sm:h-13 flex items-center justify-center text-2xl font-black rounded-xl bg-primary/10 text-primary border-2 border-primary/20">
                            {currentTotal}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-bold text-muted-foreground block text-center mb-1">
                            Grade
                          </Label>
                          <div
                            className={cn(
                              'h-14 sm:h-13 flex items-center justify-center text-2xl font-black rounded-xl border-2 shadow-xs transition-colors',
                              gradeBadgeStyle
                            )}
                          >
                            {currentGrade}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* View B: DESKTOP TABLE VIEW (Increased box sizes, generous padding, responsive overflow wrapper) */
              <div className="overflow-x-auto rounded-2xl border-2 border-border shadow-xs">
                <Table className="min-w-[840px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b-2">
                      <TableHead className="w-[32%] py-3.5 text-base font-bold text-foreground">
                        Subject Name
                      </TableHead>
                      <TableHead className="w-[13%] py-3.5 text-center text-base font-bold text-foreground">
                        CA / Test (20)
                      </TableHead>
                      <TableHead className="w-[13%] py-3.5 text-center text-base font-bold text-foreground">
                        Assign. (20)
                      </TableHead>
                      <TableHead className="w-[13%] py-3.5 text-center text-base font-bold text-foreground">
                        Exam (60)
                      </TableHead>
                      <TableHead className="w-[12%] py-3.5 text-center text-base font-bold text-foreground">
                        Total (100)
                      </TableHead>
                      <TableHead className="w-[10%] py-3.5 text-center text-base font-bold text-foreground">
                        Grade
                      </TableHead>
                      <TableHead className="w-[7%] py-3.5 text-center text-base font-bold text-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const currentTotal = watchedResults?.[index]?.total_score || 0;
                      const currentGrade = watchedResults?.[index]?.grade || getGrade(currentTotal);
                      const gradeBadgeStyle = getGradeColorClass(currentGrade);

                      return (
                        <TableRow key={field.id} className="hover:bg-muted/30">
                          {/* Subject Name Input - Increased Size */}
                          <TableCell className="p-3">
                            <FormField
                              control={form.control}
                              name={`results.${index}.subject_name`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g. Mathematics"
                                      className="h-12 text-base font-semibold border-2 rounded-xl px-3"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>

                          {/* CA Score - Increased Size */}
                          <TableCell className="p-3">
                            <FormField
                              control={form.control}
                              name={`results.${index}.ca_score`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      max={20}
                                      {...field}
                                      className="h-12 text-lg font-bold text-center border-2 rounded-xl"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>

                          {/* Assignment Score - Increased Size */}
                          <TableCell className="p-3">
                            <FormField
                              control={form.control}
                              name={`results.${index}.assignment_score`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      max={20}
                                      {...field}
                                      className="h-12 text-lg font-bold text-center border-2 rounded-xl"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>

                          {/* Exam Score - Increased Size */}
                          <TableCell className="p-3">
                            <FormField
                              control={form.control}
                              name={`results.${index}.exam_score`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      max={60}
                                      {...field}
                                      className="h-12 text-lg font-bold text-center border-2 rounded-xl"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>

                          {/* Calculated Total - Increased Size */}
                          <TableCell className="p-3">
                            <div className="h-12 flex items-center justify-center text-lg font-black rounded-xl bg-primary/10 text-primary border-2 border-primary/20">
                              {currentTotal}
                            </div>
                          </TableCell>

                          {/* Grade - Increased Size */}
                          <TableCell className="p-3">
                            <div
                              className={cn(
                                'h-12 flex items-center justify-center text-lg font-black rounded-xl border-2 shadow-xs',
                                gradeBadgeStyle
                              )}
                            >
                              {currentGrade}
                            </div>
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="p-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length <= 1}
                              className="h-11 w-11 text-destructive hover:bg-destructive/10 rounded-xl"
                            >
                              <MinusCircle className="h-6 w-6" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Quick Add Subject & Quick Subject Suggestions */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    subject_name: '',
                    ca_score: 0,
                    assignment_score: 0,
                    exam_score: 0,
                    total_score: 0,
                    grade: 'F',
                  })
                }
                disabled={fields.length >= 25}
                className="h-12 px-6 text-base font-bold rounded-xl border-2 shadow-xs"
              >
                <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                Add Another Subject
              </Button>

              {/* Quick suggestion chips for common Islamic and general curriculum subjects */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-muted-foreground">
                <span className="font-semibold text-xs shrink-0">Quick Add:</span>
                {DEFAULT_SUBJECTS.filter(
                  (s) => !fields.some((f) => f.subject_name?.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 3)
                  .map((subName) => (
                    <button
                      key={subName}
                      type="button"
                      onClick={() =>
                        append({
                          subject_name: subName,
                          ca_score: 0,
                          assignment_score: 0,
                          exam_score: 0,
                          total_score: 0,
                          grade: 'F',
                        })
                      }
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary border font-medium text-xs transition-colors"
                    >
                      + {subName}
                    </button>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Overall Performance & Final Save */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              3. Overall Performance &amp; Position
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Summary statistics across all entered subjects.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Total Marks
              </Label>
              <div className="h-14 flex items-center justify-center text-2xl font-black rounded-xl bg-muted/60 border-2 text-foreground font-mono">
                {(overallTotal || 0).toFixed(1)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Average (%)
              </Label>
              <div className="h-14 flex items-center justify-center text-2xl font-black rounded-xl bg-muted/60 border-2 text-foreground font-mono">
                {(overallAverage || 0).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Overall Grade
              </Label>
              <div
                className={cn(
                  'h-14 flex items-center justify-center text-2xl font-black rounded-xl border-2',
                  getGradeColorClass(getGrade(overallAverage))
                )}
              >
                {getGrade(overallAverage)}
              </div>
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Class Position
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 1st, 2nd, 3rd"
                      {...field}
                      className="h-14 text-xl font-bold text-center rounded-xl border-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="p-4 sm:p-6 bg-muted/20 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              {fields.length} subject{fields.length === 1 ? '' : 's'} entered · Total:{' '}
              <strong>{overallTotal}</strong> pts
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full sm:w-auto px-10 text-lg font-bold rounded-xl shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving All Results...
                </>
              ) : (
                'Save All Results'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

function ChildResults({ child, terms }: { child: Student; terms: Term[] }) {
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'results'), where('studentId', '==', child.id));
  }, [firestore, child.id]);

  const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);

  if (resultsLoading) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  const resultsByTerm =
    results?.reduce((acc, result) => {
      const termName = result.termName || 'Unknown Term';
      if (!acc[termName]) {
        acc[termName] = [];
      }
      acc[termName].push(result);
      return acc;
    }, {} as Record<string, Result[]>) || {};

  return (
    <AccordionItem value={child.id} key={child.id} className="border-b-0">
      <Card className="overflow-hidden border-2 shadow-sm rounded-2xl">
        <AccordionTrigger className="p-5 sm:p-6 hover:no-underline bg-muted/40 transition-colors">
          <div className="flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg sm:text-xl text-foreground">{child.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Class: {child.class} · Admission: {child.admissionNo}
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="p-4 sm:p-6 space-y-8">
            {Object.keys(resultsByTerm).length > 0 ? (
              Object.entries(resultsByTerm).map(([termName, termResults]) => {
                const totalMarks = termResults.reduce((sum, r) => sum + r.total_score, 0);
                const average = totalMarks / termResults.length;
                const position = termResults[0]?.position || 'N/A';

                return (
                  <div key={termName} className="mb-8 last:mb-0 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-bold text-lg sm:text-xl text-foreground">{termName}</h4>
                      <span className="text-xs bg-muted px-2.5 py-1 rounded-md font-semibold text-muted-foreground">
                        {termResults.length} Subject{termResults.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Responsive Score Table */}
                    <div className="overflow-x-auto rounded-xl border-2 border-border shadow-xs">
                      <Table className="min-w-[600px]">
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="text-foreground font-bold">Subject</TableHead>
                            <TableHead className="text-center text-foreground font-bold">CA/Test (20)</TableHead>
                            <TableHead className="text-center text-foreground font-bold">Assign. (20)</TableHead>
                            <TableHead className="text-center text-foreground font-bold">Exam (60)</TableHead>
                            <TableHead className="text-center text-foreground font-bold">Total (100)</TableHead>
                            <TableHead className="text-center text-foreground font-bold">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {termResults.map((r) => (
                            <TableRow key={r.id} className="hover:bg-muted/20">
                              <TableCell className="font-semibold text-foreground">{r.subject_name}</TableCell>
                              <TableCell className="text-center font-medium">{r.ca_score}</TableCell>
                              <TableCell className="text-center font-medium">{r.assignment_score}</TableCell>
                              <TableCell className="text-center font-medium">{r.exam_score}</TableCell>
                              <TableCell className="text-center font-bold text-primary">{r.total_score}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    'inline-block px-3 py-1 rounded-lg font-bold text-sm border',
                                    getGradeColorClass(r.grade)
                                  )}
                                >
                                  {r.grade}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Performance Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
                      <div className="p-3 bg-muted/60 rounded-xl border">
                        <span className="text-xs text-muted-foreground block font-bold uppercase">Total Marks</span>
                        <span className="text-lg font-black text-foreground">{totalMarks.toFixed(1)}</span>
                      </div>
                      <div className="p-3 bg-muted/60 rounded-xl border">
                        <span className="text-xs text-muted-foreground block font-bold uppercase">Average</span>
                        <span className="text-lg font-black text-foreground">{average.toFixed(1)}%</span>
                      </div>
                      <div className="p-3 bg-muted/60 rounded-xl border">
                        <span className="text-xs text-muted-foreground block font-bold uppercase">Overall Grade</span>
                        <span className="text-lg font-black text-foreground">{getGrade(average)}</span>
                      </div>
                      <div className="p-3 bg-muted/60 rounded-xl border">
                        <span className="text-xs text-muted-foreground block font-bold uppercase">Position</span>
                        <span className="text-lg font-black text-foreground">{position}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No examination results have been uploaded for {child.fullName} yet.
              </p>
            )}
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}

function ParentResultsView({ children, terms }: { children: Student[]; terms: Term[] }) {
  return (
    <Card className="border-2 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Your Children's Results</CardTitle>
        <CardDescription className="text-base">
          View academic reports and examination performance for your enrolled children.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {children.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">
            You do not have any children linked to this parent account.
          </p>
        )}
        <Accordion type="multiple" className="w-full space-y-4">
          {children.map((child) => (
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
        termsData.forEach((t) => batch.set(doc(termsRef, t.id), t));
        await batch.commit();
        setDataVersion((v) => v + 1);
      }
    };
    seedTerms();
  }, [firestore, user?.role]);

  // Data fetching hooks
  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    if (user.role === 'parent') return query(collection(firestore, 'students'), where('parentUserId', '==', user.uid));
    if (user.role === 'super_admin') return collection(firestore, 'students');
    if ((user.role === 'branch_admin' || user.role === 'teacher') && user.branchId) {
      return query(collection(firestore, 'students'), where('branchId', '==', user.branchId));
    }
    return null;
  }, [user, firestore]);

  const termsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'terms');
  }, [firestore, dataVersion]);

  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  const { data: termsData, isLoading: termsLoading } = useCollection<Term>(termsQuery);

  if (!user) return <p className="p-4 text-center">Loading user details...</p>;

  const handleNewResult = () => setDataVersion((v) => v + 1);

  const isDataLoading = studentsLoading || termsLoading;
  const isParent = user.role === 'parent';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Student Examination Results
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            {isParent
              ? "View academic performance and report cards for your children."
              : 'Record, calculate, and publish student terminal examination scores.'}
          </p>
        </div>
      </div>

      {isParent ? (
        isDataLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <ParentResultsView children={students || []} terms={termsData || []} />
        )
      ) : isDataLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <BulkResultEntryForm
          students={students || []}
          terms={termsData || []}
          onResultAdded={handleNewResult}
        />
      )}
    </div>
  );
}
