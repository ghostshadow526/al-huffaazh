
'use client';
import { Button } from "@/components/ui/button"
import Link from "next/link";

export function HeroSection() {
    const scrollToContact = () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <section className="relative bg-white py-24 md:py-32 lg:py-40 text-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/50 to-white"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-primary-deep tracking-tight">
                    Welcome to Al-Huffaazh Academy
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 font-body">
                    Building disciplined scholars through excellence and faith.
                </p>
                <div className="mt-8 flex justify-center gap-4 flex-wrap">
                    <Button asChild size="lg" className="rounded-xl bg-primary-deep hover:bg-primary-deep/90 shadow-lg transition-transform hover:scale-105">
                        <Link href="/branches">View Our Branches</Link>
                    </Button>
                     <Button asChild size="lg" variant="outline" className="rounded-xl border-2 border-primary-deep text-primary-deep shadow-lg transition-transform hover:scale-105 hover:bg-accent/50" onClick={scrollToContact}>
                        <a href="#contact">Contact Us</a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
