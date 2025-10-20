
'use client';

import { useParams, notFound } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, doc, getDoc, orderBy } from 'firebase/firestore';
import type { Student } from '@/app/(app)/students/student-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Result {
    id: string;
    termId: string;
    termName: string;
    subjectId: string;
    subjectName: string;
    marks: number;
}

export default function ChildResultsPage() {
    const params = useParams();
    const studentId = params.studentId as string;
    const firestore = useFirestore();

    const [student, setStudent] = useState<Student | null>(null);
    const [studentLoading, setStudentLoading] = useState(true);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return query(
            collection(firestore, 'results'),
            where('studentId', '==', studentId),
            orderBy('recordedAt', 'desc')
        );
    }, [firestore, studentId]);

    const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);

    useEffect(() => {
        if (!firestore || !studentId) return;
        const fetchStudent = async () => {
            setStudentLoading(true);
            const studentDoc = await getDoc(doc(firestore, 'students', studentId));
            if (studentDoc.exists()) {
                setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
            } else {
                notFound();
            }
            setStudentLoading(false);
        };
        fetchStudent();
    }, [firestore, studentId]);

    const resultsByTerm = useMemo(() => {
        if (!results) return {};
        return results.reduce((acc, result) => {
            const term = result.termName;
            if (!acc[term]) {
                acc[term] = [];
            }
            acc[term].push(result);
            return acc;
        }, {} as Record<string, Result[]>);
    }, [results]);

    const getGrade = (marks: number) => {
        if (marks >= 90) return { grade: 'A+', color: 'bg-green-500' };
        if (marks >= 80) return { grade: 'A', color: 'bg-green-400' };
        if (marks >= 70) return { grade: 'B', color: 'bg-blue-400' };
        if (marks >= 60) return { grade: 'C', color: 'bg-yellow-400' };
        if (marks >= 50) return { grade: 'D', color: 'bg-orange-400' };
        return { grade: 'F', color: 'bg-red-500' };
    }

    if (studentLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!student) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Academic Results</h2>
                    <p className="text-muted-foreground">Showing results for {student.fullName}</p>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Results by Term</CardTitle>
                    <CardDescription>A summary of academic performance in each term.</CardDescription>
                </CardHeader>
                <CardContent>
                    {resultsLoading ? (
                         <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : Object.keys(resultsByTerm).length > 0 ? (
                        <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(resultsByTerm)[0]}>
                            {Object.entries(resultsByTerm).map(([termName, termResults]) => (
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
                    ) : (
                        <p className="text-center text-muted-foreground h-24 flex items-center justify-center">No results have been recorded for this student yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
