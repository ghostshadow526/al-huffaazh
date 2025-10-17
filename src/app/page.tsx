"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8 text-accent" />
            <span className="text-xl font-headline text-foreground">Al-Huffaazh Academy</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/login">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container text-center">
            <div className="absolute inset-0 -z-10">
                <Image 
                    src="https://picsum.photos/seed/1/1200/800" 
                    alt="Quran"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="opacity-20"
                    data-ai-hint="holy book"
                />
                <div className="absolute inset-0 bg-background/80"></div>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Nurturing the Next Generation of Huffaazh
            </h1>
            <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Al-Huffaazh Academy is dedicated to providing quality Quranic education, helping students on their journey to memorize the Holy Quran.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/login">Access Portal</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Al-Huffaazh Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
