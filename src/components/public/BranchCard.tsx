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

const getBranchUrl = (branchName: string): string => {
    const slug = branchName.toLowerCase().replace(/ – /g, ' ').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

    // Handle specific cases based on the full name to ensure correct routing
    switch (branchName) {
        case 'Dokan Lere Branch':
            return '/branches/dokan-lere';
        case 'Gambare Ogbomosho Branch':
            return '/branches/gambare-ogbomosho';
        case 'Hamama Ogbomosho Branch':
            return '/branches/hamama-ogbomosho';
        case 'JOS – Dutse Uku Branch':
            return '/branches/jos-dutse-uku';
        case 'Katchia Branch':
            return '/branches/katchia';
        case 'Kayarda Branch':
            return '/branches/kayarda';
        case 'Lere Branch':
            return '/branches/lere';
        case 'Mariri Branch':
            return '/branches/mariri';
        case 'Marwa Branch':
            return '/branches/marwa';
        case 'Naraguta Branch':
            return '/branches/naraguta';
        case 'Nye Kogi State Branch':
            return '/branches/nye-kogi-state';
        case 'Sakee Branch':
            return '/branches/sakee';
        case 'Saminaka Branch':
            return '/branches/saminaka';
        case 'Toro Branch':
            return '/branches/toro';
        default:
            // Fallback for dynamic slugs if a specific case isn't matched
            return `/branches/${slug}`;
    }
};

export function BranchCard({ branch }: { branch: Branch }) {
    
  const branchUrl = getBranchUrl(branch.name);

  // Do not render cards for malformed branch data
  if (['Jos', 'Keffi', 'Ogbomosho', 'Saminaka', 'lere'].includes(branch.name)) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      <CardContent className="p-0">
        <div className="relative h-48 w-full">
            <Image 
                src={`https://picsum.photos/seed/${branch.slug}/600/400`} 
                alt={`${branch.name}`}
                fill
                style={{objectFit: 'cover'}}
                className="transition-transform duration-500 group-hover:scale-110"
                data-ai-hint="school building"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-xl font-bold text-white font-headline">{branch.name}</h3>
                <p className="text-sm text-gray-200">{branch.address}</p>
            </div>
        </div>
        <div className="p-4 bg-white">
            <Button asChild variant="link" className="p-0 h-auto text-primary-deep font-semibold">
                <Link href={branchUrl}>
                    Visit Branch Website
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
