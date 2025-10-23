
'use client';

import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "../ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#about', label: 'About Us' },
    { href: '/branches', label: 'Branches' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/#contact', label: 'Contact' },
];


export function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex h-20 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo className="h-10 w-10 text-primary-deep" />
                            <span className="font-headline text-2xl font-bold text-primary-deep">
                                Al-Huffaazh
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                           {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "text-base font-medium text-gray-600 hover:text-primary-deep transition-colors pb-1",
                                        (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))) && "text-primary-deep border-b-2 border-primary-deep"
                                    )}
                                >
                                    {link.label}
                                </Link>
                           ))}
                        </nav>
                        
                        <div className="flex items-center gap-2">
                             <Button asChild className="hidden sm:inline-flex rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                                <Link href="/login">Portal Login</Link>
                            </Button>
                            {/* Mobile menu button can be added here */}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {children}
            </main>

            <footer className="bg-primary-deep text-white font-body">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* About */}
                        <div className="md:col-span-2">
                             <Link href="/" className="flex items-center gap-2 mb-4">
                                <Logo className="h-10 w-10 text-white" />
                                <span className="font-headline text-2xl font-bold text-white">
                                    Al-Huffaazh Academy
                                </span>
                            </Link>
                            <p className="text-gray-300 max-w-md">
                                Nurturing a generation of scholars rooted in faith and equipped with modern knowledge for a balanced and successful life.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-headline text-xl font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                {navLinks.map(link => (
                                     <li key={link.href}>
                                        <Link href={link.href} className="text-gray-300 hover:text-white transition-colors hover:underline">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                                 <li>
                                    <Link href="/login" className="text-gray-300 hover:text-white transition-colors hover:underline">
                                        Staff/Parent Portal
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                             <h3 className="font-headline text-xl font-semibold mb-4">Get In Touch</h3>
                             <ul className="mt-4 space-y-2 text-gray-300">
                                 <li className="flex items-center gap-2">
                                     <MapPin size={16} />
                                     <span>Main Office, Jos, Nigeria</span>
                                 </li>
                                 <li className="flex items-center gap-2">
                                     <Mail size={16} />
                                     <a href="mailto:contact@alhuffaazh.com" className="hover:text-white hover:underline">contact@alhuffaazh.com</a>
                                 </li>
                                 <li className="flex items-center gap-2">
                                     <Phone size={16} />
                                     <a href="tel:+234123456789" className="hover:text-white hover:underline">+234 (123) 456-789</a>
                                 </li>
                             </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-600 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
