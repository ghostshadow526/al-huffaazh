'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    const isDokanLere = branch.slug === 'dokan-lere-branch';
    const href = isDokanLere ? '/branches/dokan-lere' : `/branches/${branch.slug}`;

    return (
        <Card className="rounded-2xl shadow-md overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1">
            <CardContent className="p-0">
                <div className="relative h-48 w-full">
                    <Image 
                        src={`https://picsum.photos/seed/${branch.slug}/600/400`}
                        alt={`${branch.name} building`}
                        fill
                        style={{objectFit: 'cover'}}
                        className="transition-transform duration-500 group-hover:scale-105"
                        data-ai-hint="school building exterior"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6 bg-white">
                    <h3 className="text-xl font-bold font-headline text-primary-deep truncate" title={branch.name}>{branch.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1 h-10">{branch.address}</p>
                    <Button asChild className="mt-4 rounded-xl" variant="outline">
                        <Link href={href}>
                            Visit Branch <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
