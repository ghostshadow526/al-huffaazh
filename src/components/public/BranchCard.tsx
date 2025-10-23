
'use client';

import { Card, CardContent } from '../ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
    return (
        <Link href={`/branches/${branch.slug}`} className="group block">
            <Card className="rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative h-48 w-full">
                        <Image
                            src={`https://picsum.photos/seed/${branch.slug}/400/300`}
                            alt={branch.name}
                            fill
                            style={{objectFit: 'cover'}}
                            className="transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint="school building"
                        />
                    </div>
                    <div className="p-6 bg-white">
                        <h3 className="text-xl font-bold font-headline text-primary-deep mb-2">{branch.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 h-10">{branch.address}</p>
                        <div className="flex justify-end">
                             <Button variant="link" className="text-primary-deep font-semibold p-0 h-auto">
                                Visit Branch
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
