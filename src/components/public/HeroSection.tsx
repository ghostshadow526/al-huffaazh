
'use client';

import Image from 'next/image';
import { Button } from '../ui/button';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://picsum.photos/seed/hero-bg/1800/1200"
                    alt="Hero background image of a school"
                    fill
                    style={{objectFit: 'cover'}}
                    priority
                    data-ai-hint="school students outside"
                />
                <div className="absolute inset-0 bg-primary-deep/60"></div>
            </div>
            <div className="relative z-10 container mx-auto px-4 space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight drop-shadow-lg">
                    Excellence in Faith & Knowledge
                </h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-200 drop-shadow-md">
                    Nurturing the next generation of leaders with a balanced blend of Islamic and modern education.
                </p>
                <div className="space-x-4">
                    <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href="/#branches">Explore Our Branches</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-xl border-white text-white hover:bg-white hover:text-primary-deep">
                        <Link href="/login">Portal Login</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
