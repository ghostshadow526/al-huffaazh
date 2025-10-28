'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Facebook, Phone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/branches', label: 'Branches' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white font-body text-gray-800">
      <header className="sticky top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" aria-label="Al-Huffaazh Academy Home">
              <Logo className="h-10 w-10 text-primary" />
              <span className="font-bold font-headline text-xl text-primary-deep hidden sm:inline">
                Al-Huffaazh
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-base font-medium transition-colors hover:text-primary-deep',
                    pathname === link.href ? 'text-primary-deep font-semibold' : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
                 <Button asChild className='hidden md:inline-flex'>
                    <Link href="/login">Portal Login</Link>
                </Button>
                <div className="md:hidden">
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu size={28} />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full max-w-sm p-0">
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between p-4 border-b">
                                     <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                        <Logo className="h-8 w-8 text-primary" />
                                        <span className="font-bold text-lg text-primary-deep">Al-Huffaazh</span>
                                    </Link>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <X size={24} />
                                            <span className="sr-only">Close menu</span>
                                        </Button>
                                    </SheetTrigger>
                                </div>
                                <nav className="flex flex-col gap-4 p-4 text-lg">
                                    {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            'font-medium transition-colors hover:text-primary-deep p-2 rounded-md',
                                             pathname === link.href ? 'text-primary-deep bg-accent' : 'text-gray-700'
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                    ))}
                                    <Button asChild size="lg" className="mt-4">
                                        <Link href="/login">Portal Login</Link>
                                    </Button>
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
       <footer className="bg-primary-deep text-primary-foreground/80 py-12 md:py-16">
            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-4">
                     <h3 className="text-xl font-bold font-headline text-white">Al-Huffaazh Academy</h3>
                     <p>
                        A premier institution dedicated to nurturing faith and knowledge. We provide a balanced education, combining Islamic teachings with modern academic excellence to prepare students for success in this life and the hereafter.
                     </p>
                </div>
                <div className="md:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                     <div>
                        <h4 className="font-semibold font-headline text-white mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link href="/branches" className="hover:text-white">Our Branches</Link></li>
                            <li><Link href="/gallery" className="hover:text-white">Gallery</Link></li>
                            <li><Link href="/login" className="hover:text-white">Login to Portal</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold font-headline text-white mb-4">Contact Us</h4>
                        <ul className="space-y-3 text-gray-300">
                           <li className="flex items-center gap-3">
                               <span>P.O.Box 006,New Bauchi Road Saminaka, Saminaka, Nigeria</span>
                           </li>
                           <li className="flex items-center gap-3">
                               <span>0803 271 9772</span>
                           </li>
                           <li className="flex items-center gap-3">
                               <a href="mailto:contact@alhuffaazh.com" className="hover:text-white">contact@alhuffaazh.com</a>
                           </li>
                       </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold font-headline text-white mb-4">Follow Us</h4>
                         <div className="flex items-center gap-4">
                            <a href="https://www.facebook.com/Alhuffaaz/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white" aria-label="Facebook">
                                <Facebook size={24} />
                            </a>
                            <a href="https://wa.me/2349162829098" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white" aria-label="WhatsApp">
                                <Phone size={24} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm">
                 <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
            </div>
      </footer>
    </div>
  );
}
