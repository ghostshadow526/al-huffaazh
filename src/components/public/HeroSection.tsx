
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative h-[80vh] md:h-[90vh] flex items-center justify-center text-white overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://raw.githubusercontent.com/ghostshadow526/boredape/main/al4.jpg"
                    alt="Students of Al-Huffaazh Academy"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="muslim students learning"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 space-y-6">
                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline leading-tight drop-shadow-lg">
                        Al-Huffaazh Academy
                    </h1>
                </div>
                 <div className="animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                    <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-200 drop-shadow-md">
                        A premier institution dedicated to nurturing faith and knowledge. We provide a balanced education, combining Islamic teachings with modern academic excellence.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
                    <Button size="lg" asChild className="rounded-full px-8 py-6 text-base bg-primary hover:bg-primary/90 shadow-lg transition-transform hover:scale-105">
                        <Link href="#branches">
                            Explore Our Branches <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="rounded-full px-8 py-6 text-base bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-transform hover:scale-105">
                        <Link href="/login">
                           <LogIn className="mr-2 h-5 w-5" /> Portal Login
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
