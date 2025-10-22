
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Image from 'next/image';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 w-full">
            <Image 
                src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                alt={`${branch.name} building`}
                fill
                style={{objectFit: 'cover'}}
                data-ai-hint="school building"
            />
        </div>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary-deep">{branch.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1 font-body">
            <MapPin size={14} className="text-gray-500" />
            {branch.address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full rounded-xl bg-primary-deep/10 text-primary-deep hover:bg-accent">
          <Link href={`/branches/${branch.slug}`}>Visit Branch</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
