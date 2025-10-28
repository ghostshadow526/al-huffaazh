
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Facebook, Instagram, Twitter, Linkedin, Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/branches', label: 'Branches' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
];

const socialLinks = [
    { href: 'https://www.facebook.com/Alhuffaaz/', icon: Facebook, label: 'Facebook' },
    { href: 'https://wa.me/2349162829098', icon: Instagram, label: 'WhatsApp' }, // Using Instagram icon for WA
];

export function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-body text-gray-800">
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-10 w-10 text-primary" />
              <span className="font-bold text-xl text-primary-deep font-headline">
                Al-Huffaazh Academy
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-base font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary font-semibold' : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
                 <Button asChild className="bg-primary-deep hover:bg-primary-deep/90 text-white rounded-xl">
                    <Link href="/login">Portal Login</Link>
                </Button>
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="md:hidden">
                 <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-sm bg-primary-deep text-white p-6">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-8">
                                 <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Logo className="h-8 w-8 text-white" />
                                    <span className="font-bold text-lg text-white font-headline">Al-Huffaazh</span>
                                </Link>
                                <SheetTrigger asChild>
                                     <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                        <X className="h-6 w-6" />
                                        <span className="sr-only">Close menu</span>
                                    </Button>
                                </SheetTrigger>
                            </div>
                            <nav className="flex flex-col gap-4 flex-1">
                                {navLinks.map((link) => (
                                    <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        'text-xl p-3 rounded-lg font-medium transition-colors hover:bg-white/10',
                                        pathname === link.href ? 'bg-white/20 font-semibold' : ''
                                    )}
                                    >
                                    {link.label}
                                    </Link>
                                ))}
                            </nav>
                             <Button asChild className="w-full bg-white hover:bg-gray-100 text-primary-deep rounded-xl text-lg py-6 mt-4">
                                <Link href="/login">Portal Login</Link>
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <main>{children}</main>
      
      <footer className="bg-primary-deep text-white pt-16 pb-8">
            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-4">
                     <h3 className="text-2xl font-bold font-headline">Al-Huffaazh Academy</h3>
                     <p className="text-gray-300 max-w-sm">
                        A premier institution dedicated to nurturing faith and knowledge. We provide a balanced education, combining Islamic teachings with modern academic excellence to prepare students for success in this life and the hereafter.
                     </p>
                </div>
                 <div className="space-y-4">
                    <h4 className="text-xl font-semibold font-headline">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link href="/about" className="hover:text-white transition-colors text-gray-300">About Us</Link></li>
                        <li><Link href="/branches" className="hover:text-white transition-colors text-gray-300">Our Branches</Link></li>
                        <li><Link href="/gallery" className="hover:text-white transition-colors text-gray-300">Gallery</Link></li>
                        <li><Link href="/login" className="hover:text-white transition-colors text-gray-300">Login to Portal</Link></li>
                    </ul>
                </div>
                 <div className="space-y-4">
                     <h4 className="text-xl font-semibold font-headline">Contact Us</h4>
                     <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-3">
                            <MapPin size={18} />
                            <span>Main Office, Jos, Nigeria</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={18} />
                            <a href="tel:+2341234567890" className="hover:text-white transition-colors">+234 123 456 7890</a>
                        </li>
                         <li className="flex items-center gap-3">
                            <Mail size={18} />
                            <a href="mailto:contact@alhuffaazh.com" className="hover:text-white transition-colors">contact@alhuffaazh.com</a>
                        </li>
                     </ul>
                      <div className="flex gap-4 mt-4">
                        {socialLinks.map(social => (
                             <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                                <social.icon size={24} />
                                <span className="sr-only">{social.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 text-center mt-12 border-t border-white/20 pt-8">
                <p className="text-gray-400">&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
            </div>
      </footer>
    </div>
  );
}
