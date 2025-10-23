'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
  // Special override for Dokan Lere and Gambare Ogbomosho branches
  let href;
  if (branch.name === "Dokan Lere Branch") {
    href = "/branches/dokan-lere";
  } else if (branch.name === "Gambare Ogbomosho Branch") {
    href = "/branches/gambare-ogbomosho";
  } else {
    href = `/branches/${branch.slug}`;
  }

  return (
     <Card className="flex flex-col overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
        <div className="relative h-48 w-full">
             <Image 
                src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                alt={`${branch.name}`}
                fill
                style={{objectFit: 'cover'}}
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="school students building"
             />
        </div>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary-deep">{branch.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin size={16} className="mt-1 shrink-0"/>
            <p className="text-sm">{branch.address}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary-deep hover:bg-primary-deep/90">
            <Link href={href}>Visit Branch</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
