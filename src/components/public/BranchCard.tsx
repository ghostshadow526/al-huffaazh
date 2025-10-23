
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
    return (
        <Card className="rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <CardContent className="p-0">
                <div className="relative h-48 w-full">
                    <Image
                        src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                        alt={branch.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="transition-transform duration-500 group-hover:scale-105"
                        data-ai-hint="school building"
                    />
                </div>
                <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold font-headline text-primary-deep">{branch.name}</h3>
                    <div className="flex items-start gap-2 text-gray-500">
                        <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                        <p className="text-sm">{branch.address}</p>
                    </div>
                     <Button asChild className="w-full rounded-xl mt-2 bg-primary-deep/90 hover:bg-primary-deep">
                        <Link href={`/branches/${branch.slug}`}>Visit Branch</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
