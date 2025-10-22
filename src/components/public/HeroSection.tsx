
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-40 lg:py-56">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white">
        <div 
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(180deg, #CFF7E6 0%, #FFFFFF 100%)',
                opacity: 0.5
            }}
        />
        <Image 
          src="https://picsum.photos/seed/hero/1800/1200" 
          alt="Quran education"
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="opacity-10 mix-blend-luminosity"
          data-ai-hint="education learning"
        />
      </div>
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter text-primary-deep sm:text-5xl md:text-6xl lg:text-7xl font-headline">
          Welcome to Al-Huffaazh Academy
        </h1>
        <p className="mx-auto mt-6 max-w-[700px] text-lg text-gray-700 md:text-xl font-body">
          Building disciplined scholars through excellence and faith.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" asChild className="rounded-xl bg-primary-deep hover:bg-primary-deep/90 text-white shadow-lg shadow-green-900/10">
            <Link href="/branches">View Branches</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-xl border-primary-deep/50 hover:bg-accent text-primary-deep">
            <Link href="#contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
