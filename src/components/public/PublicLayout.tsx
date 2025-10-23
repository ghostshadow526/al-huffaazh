
'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
    { href: '/#about', text: 'About' },
    { href: '/#branches', text: 'Branches' },
    { href: '/#gallery', text: 'Gallery' },
    { href: '/#contact', text: 'Contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-body">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-20 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <Logo className="h-8 w-8 text-primary-deep" />
                        <span className="font-headline">Al-Huffaazh</span>
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6 text-base font-medium">
                       {navLinks.map(link => (
                          <Link key={link.href} href={link.href} className="text-gray-600 hover:text-primary-deep transition-colors">
                              {link.text}
                          </Link>
                       ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-2">
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/login">Parent Portal</Link>
                        </Button>
                        <Button asChild className="rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                           <Link href="/login">Staff Portal</Link>
                        </Button>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden">
                       <Sheet open={isOpen} onOpenChange={setIsOpen}>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-full max-w-sm bg-background p-6">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <Link href="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setIsOpen(false)}>
                                        <Logo className="h-8 w-8 text-primary-deep" />
                                        <span className="font-headline">Al-Huffaazh</span>
                                    </Link>
                                </div>

                                <nav className="flex flex-col gap-6 text-lg font-medium">
                                    {navLinks.map(link => (
                                      <Link key={link.href} href={link.href} className="text-gray-600 hover:text-primary-deep transition-colors" onClick={() => setIsOpen(false)}>
                                          {link.text}
                                      </Link>
                                   ))}
                                </nav>
                                <div className="mt-auto space-y-4">
                                     <Button asChild variant="outline" className="w-full rounded-xl" onClick={() => setIsOpen(false)}>
                                        <Link href="/login">Parent Portal</Link>
                                    </Button>
                                    <Button asChild className="w-full rounded-xl bg-primary-deep hover:bg-primary-deep/90" onClick={() => setIsOpen(false)}>
                                       <Link href="/login">Staff Portal</Link>
                                    </Button>
                                </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            
            <main>
                {children}
            </main>

            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                         <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
                         <div className="flex items-center gap-4">
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
                         </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
