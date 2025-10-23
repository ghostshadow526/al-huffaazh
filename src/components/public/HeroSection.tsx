
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function HeroSection() {
    return (
        <section className="relative bg-white pt-20 pb-24 md:pt-32 md:pb-40">
            {/* Gradient background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/50 to-white -z-10"></div>
            
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary-deep leading-tight">
                            Welcome to <br /> Al-Huffaazh Academy
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 font-body max-w-xl mx-auto md:mx-0">
                            Building disciplined scholars through excellence in faith and modern education.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-4">
                            <Button asChild size="lg" className="rounded-xl w-full sm:w-auto bg-primary-deep hover:bg-primary-deep/90">
                                <Link href="/branches">
                                    View Our Branches
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="rounded-xl w-full sm:w-auto">
                                <Link href="#contact">Contact Us</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <Image 
                           src="https://picsum.photos/seed/hero/700/500"
                           alt="Happy students at Al-Huffaazh Academy"
                           width={700}
                           height={500}
                           className="rounded-2xl shadow-xl"
                           data-ai-hint="happy students school"
                           priority
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
