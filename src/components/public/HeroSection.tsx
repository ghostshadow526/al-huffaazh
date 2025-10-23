
'use client';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center text-center px-4 pt-24 pb-12 bg-gradient-to-b from-accent/30 to-background">
            <div className="container mx-auto space-y-6 z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary-deep font-headline">
                    Welcome to Al-Huffaazh Academy
                </h1>
                <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-body">
                    Building disciplined scholars through excellence and faith.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button asChild size="lg" className="rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                        <Link href="/branches">View Branches</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-xl">
                        <Link href="#contact">Contact Us</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
