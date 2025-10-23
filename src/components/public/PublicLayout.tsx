
'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { MapPin, Mail, Phone } from 'lucide-react'; // Corrected: Added MapPin import

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10 text-primary-deep" />
            <span className="text-xl font-bold text-primary-deep font-headline">
              Al-Huffaazh Academy
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/#about" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">
              About
            </Link>
            <Link href="/branches" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">
              Branches
            </Link>
             <Link href="/#gallery" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">
              Gallery
            </Link>
            <Link href="/#contact" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">
              Contact
            </Link>
          </nav>
          <Button asChild className="hidden md:flex rounded-xl bg-primary-deep hover:bg-primary-deep/90">
            <Link href="/login">Portal Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

       <footer className="bg-primary-deep text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo className="h-10 w-10" />
                <span className="text-xl font-bold font-headline">Al-Huffaazh Academy</span>
              </div>
              <p className="text-gray-300">
                Building a generation of disciplined scholars through a blend of Islamic and Western education.
              </p>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline tracking-wider uppercase">Quick Links</h3>
                <ul className="space-y-2">
                    <li><Link href="/#about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                    <li><Link href="/branches" className="text-gray-300 hover:text-white transition-colors">Our Branches</Link></li>
                    <li><Link href="/#gallery" className="text-gray-300 hover:text-white transition-colors">Gallery</Link></li>
                    <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors">Portal Login</Link></li>
                </ul>
            </div>

            <div className="space-y-4">
                 <h3 className="text-lg font-semibold font-headline tracking-wider uppercase">Contact Us</h3>
                 <ul className="mt-4 space-y-2 text-gray-300">
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
                        <a href="tel:+234123456789" className="hover:text-white">+234 (123) 456-7890</a>
                    </li>
                </ul>
            </div>

             <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline tracking-wider uppercase">Our Mission</h3>
                 <p className="text-gray-300">
                    To nurture scholars proficient in modern sciences and deeply rooted in the teachings of the Holy Quran.
                </p>
            </div>

          </div>
          <div className="mt-10 border-t border-primary pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
