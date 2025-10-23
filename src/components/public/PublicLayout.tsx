
'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '../logo';
import { Button } from '../ui/button';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Branches', href: '/branches' },
    { name: 'Gallery', href: '/#gallery' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 font-body">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-2 text-primary-deep hover:text-primary-deep/80 transition-colors">
              <Logo className="w-10 h-10" />
              <span className="text-xl font-bold font-headline hidden sm:inline">Al-Huffaazh Academy</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} className="text-gray-700 hover:text-primary-deep transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
                 <Button asChild variant="outline" className="rounded-xl border-primary-deep text-primary-deep hover:bg-primary-deep hover:text-white transition-all">
                    <Link href="/login">Portal Login</Link>
                </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-8">
            <div className="text-center">
                <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
