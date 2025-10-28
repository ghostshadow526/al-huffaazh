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

  // A mapping for special-cased branch names to their dedicated routes.
  const dedicatedRoutes: { [key: string]: string } = {
      'dokan-lere-branch': '/branches/dokan-lere',
      'gambare-ogbomosho-branch': '/branches/gambare-ogbomosho',
      'hamama-ogbomosho-branch': '/branches/hamama-ogbomosho',
      'jos-dutse-uku-branch': '/branches/jos-dutse-uku',
      'katchia-branch': '/branches/katchia',
      'kayarda-branch': '/branches/kayarda',
      'lere-branch': '/branches/lere',
      'mariri-branch': '/branches/mariri',
      'marwa-branch': '/branches/marwa',
      'naraguta-branch': '/branches/naraguta',
      'nye-kogi-state-branch': '/branches/nye-kogi-state',
      'sakee-branch': '/branches/sakee',
      'saminaka-branch': '/branches/saminaka',
      'toro-branch': '/branches/toro',
  };
  
  // Use the dedicated route if it exists, otherwise fall back to the dynamic slug-based route.
  const href = dedicatedRoutes[branch.slug] || `/branches/${branch.slug}`;

  return (
    <Card className="rounded-2xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative h-48">
          <Image
            src={`https://picsum.photos/seed/${branch.slug}/600/400`}
            alt={branch.name}
            fill
            style={{objectFit: 'cover'}}
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="school building exterior"
          />
        </div>
        <div className="p-6 bg-white">
          <h3 className="font-headline text-xl font-bold text-primary-deep mb-2">{branch.name}</h3>
          <p className="text-gray-600 text-sm mb-4 font-body">{branch.address}</p>
          <Button asChild variant="link" className="p-0 h-auto font-semibold text-primary-deep">
            <Link href={href}>
              Visit Branch Website <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
