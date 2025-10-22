
'use client';

import { PublicLayout } from "@/components/public/PublicLayout";
import { BranchCard } from "@/components/public/BranchCard";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export default function AllBranchesPage() {
    const firestore = useFirestore();

    const branchesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'branches'), orderBy('name'));
    }, [firestore]);

    const { data: branches, isLoading } = useCollection<Branch>(branchesQuery);

    return (
        <PublicLayout>
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">Our Branches</h1>
                        <p className="text-lg text-gray-600 mt-2 font-body">Explore our network of academies dedicated to excellence.</p>
                    </div>

                    {isLoading ? (
                         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => <Card key={i} className="rounded-2xl shadow-md"><CardContent className="p-6 h-64 animate-pulse bg-gray-200 rounded-2xl"></CardContent></Card>)}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {branches?.map(branch => (
                                <BranchCard key={branch.id} branch={branch} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
