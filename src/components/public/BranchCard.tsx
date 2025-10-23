
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Card className="group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="relative h-48 w-full">
            <Image
                src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                alt={branch.name}
                fill
                style={{objectFit: 'cover'}}
                className="group-hover:scale-105 transition-transform duration-300"
                data-ai-hint="school building"
            />
        </div>
        <div className="p-6 space-y-3">
          <h3 className="text-xl font-bold font-headline text-primary-deep">{branch.name}</h3>
          <p className="text-sm text-gray-500 font-body h-10">{branch.address}</p>
          <Button asChild variant="link" className="p-0 text-primary-deep font-semibold">
            <Link href={`/branches/${branch.slug}`}>
              Visit Branch <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
