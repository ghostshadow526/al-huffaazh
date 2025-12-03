'use client';

import { useParams, notFound } from 'next/navigation';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { Student } from '@/app/(dashboard)/students/student-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Result {
  id: string;
  termId: string;
  termName: string;
  subjectName: string;
  marks: number;
  grade: string;
}

interface ReportCard {
    id: string;
    termId: string;
    termName: string;
    imageUrl: string;
}

export default function ChildResultsPage() {
    const params = useParams();
    const studentId = params.studentId as string;
    const firestore = useFirestore();

    const [student, setStudent] = useState<Student | null>(null);
    const [studentLoading, setStudentLoading] = useState(true);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return query(collection(firestore, 'results'), where('studentId', '==', studentId));
    }, [firestore, studentId]);

    const reportCardsQuery = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return query(collection(firestore, 'reportCards'), where('studentId', '==', studentId));
    }, [firestore, studentId]);

    const { data: results, isLoading: resultsLoading } = useCollection<Result>(resultsQuery);
    const { data: reportCards, isLoading: reportCardsLoading } = useCollection<ReportCard>(reportCardsQuery);

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

    const isLoading = studentLoading || resultsLoading || reportCardsLoading;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
        )
    }

    if (!student) {
        return notFound();
    }

    // Group results by term
    const resultsByTerm = results?.reduce((acc, result) => {
        (acc[result.termId] = acc[result.termId] || { name: result.termName, results: [] }).results.push(result);
        return acc;
    }, {} as Record<string, {name: string, results: Result[]}>) || {};

    const reportCardsByTerm = reportCards?.reduce((acc, card) => {
        acc[card.termId] = card;
        return acc;
    }, {} as Record<string, ReportCard>) || {};

    const allTermIds = new Set([...Object.keys(resultsByTerm), ...Object.keys(reportCardsByTerm)]);
    const allTerms = Array.from(allTermIds).map(id => ({ id, name: resultsByTerm[id]?.name || reportCardsByTerm[id]?.termName || 'Unknown Term'}));
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Results & Reports</h2>
                    <p className="text-muted-foreground">Showing records for {student.fullName}</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>

            {allTerms.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No results or report cards have been uploaded for {student.fullName} yet.
                    </CardContent>
                </Card>
            ) : (
                allTerms.map(term => (
                    <Card key={term.id}>
                        <CardHeader>
                            <CardTitle>{term.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resultsByTerm[term.id] && (
                                <>
                                 <h3 className="font-semibold mb-2">Individual Scores</h3>
                                 <Table>
                                    <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {resultsByTerm[term.id].results.map(r => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.subjectName}</TableCell>
                                                <TableCell>{r.marks}</TableCell>
                                                <TableCell>{r.grade}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                               </>
                            )}

                            {reportCardsByTerm[term.id] && (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-2">Full Report Card</h3>
                                    <Button asChild variant="secondary">
                                        <a href={reportCardsByTerm[term.id].imageUrl} target="_blank" rel="noopener noreferrer">View Uploaded Report</a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}