'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

interface BranchCardProps {
  branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
    
    // This function maps the Firestore document ID (slug) to the correct URL path.
    const getBranchUrl = (slug: string) => {
        return `/branches/${slug}`;
    }

  const branchUrl = getBranchUrl(branch.slug);

  return (
    <Card className="rounded-2xl shadow-md overflow-hidden group transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <CardContent className="p-0">
        <div className="relative h-48 w-full">
            <Image 
                src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                alt={`${branch.name}`}
                fill
                style={{objectFit: 'cover'}}
                className="transition-transform duration-500 group-hover:scale-105"
                data-ai-hint="school building students"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-xl font-bold text-white font-headline">{branch.name}</h3>
                <p className="text-sm text-gray-200">{branch.address}</p>
            </div>
        </div>
        <div className="p-4 bg-background">
             <Button asChild className="w-full bg-primary-deep hover:bg-primary-deep/90">
                <Link href={branchUrl}>
                   Visit Branch Website <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
