
'use client';
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import React from "react";

const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Branches', href: '/branches' },
    { name: 'Gallery', href: '/#gallery' },
    { name: 'Contact', href: '/#contact' }
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="min-h-screen flex flex-col font-body bg-white">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-deep">
                        <Logo className="w-8 h-8 text-primary" />
                        <span className="font-headline">Al-Huffaazh Academy</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-base font-medium">
                        {navLinks.map(link => (
                             <Link key={link.name} href={link.href} className="text-gray-700 hover:text-primary transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="hidden md:block">
                        <Button asChild className="rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                            <Link href="/login">Portal Login</Link>
                        </Button>
                    </div>
                    <div className="md:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <div className="p-6">
                                     <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-deep mb-8" onClick={() => setIsOpen(false)}>
                                        <Logo className="w-8 h-8 text-primary" />
                                        <span className="font-headline">Al-Huffaazh</span>
                                    </Link>
                                    <nav className="flex flex-col gap-6 text-lg font-medium">
                                        {navLinks.map(link => (
                                            <Link key={link.name} href={link.href} className="text-gray-700 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                                                {link.name}
                                            </Link>
                                        ))}
                                    </nav>
                                    <Button asChild className="w-full mt-8 rounded-xl bg-primary-deep hover:bg-primary-deep/90" onClick={() => setIsOpen(false)}>
                                        <Link href="/login">Portal Login</Link>
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-headline text-2xl font-semibold">Al-Huffaazh Academy</h3>
                            <p className="mt-2 text-gray-400">Building disciplined scholars through excellence and faith.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold text-lg text-gray-300">Quick Links</h4>
                             <ul className="mt-4 space-y-2">
                                {navLinks.map(link => (
                                    <li key={link.href}><Link href={link.href} className="text-gray-400 hover:text-white">{link.name}</Link></li>
                                ))}
                                <li><Link href="/login" className="text-gray-400 hover:text-white">Portal Login</Link></li>
                            </ul>
                        </div>
                         <div>
                             <h4 className="font-semibold text-lg text-gray-300">Contact Us</h4>
                             <ul className="mt-4 space-y-2 text-gray-400">
                                <li className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    <span>Main Office, Jos, Nigeria</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <a href="mailto:info@alhuffaazh.com" className="hover:text-white">info@alhuffaazh.com</a>
                                </li>
                                 <li className="flex items-center gap-2">
                                    <Phone size={16} />
                                    <a href="tel:+234123456789" className="hover:text-white">+234 (123) 456-789</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-500">
                        <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

