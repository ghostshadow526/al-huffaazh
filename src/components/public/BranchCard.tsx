
'use client';

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export function BranchCard({ branch }: { branch: Branch }) {
    const href = `/branches/${branch.slug}`;

    return (
        <Card className="rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden h-full group">
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                    alt={branch.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="school building exterior"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            </div>
            <CardHeader className="pt-4 flex-1">
                <CardTitle className="font-headline text-xl text-primary-deep">{branch.name}</CardTitle>
                <CardDescription className="text-sm">{branch.address}</CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button asChild variant="link" className="font-semibold text-primary-deep px-0">
                    <Link href={href}>
                        Visit Branch Website <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
