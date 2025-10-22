
import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Instagram } from 'lucide-react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-800">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-20 items-center px-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Logo className="h-10 w-10 text-primary-deep" />
            <span className="text-2xl font-headline text-primary-deep">Al-Huffaazh Academy</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <Link href="/#about" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">About</Link>
            <Link href="/#branches" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">Branches</Link>
            <Link href="/#gallery" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">Gallery</Link>
            <Link href="/#contact" className="text-sm font-medium text-gray-600 hover:text-primary-deep transition-colors">Contact</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-6">
            <Button variant="outline" asChild className="rounded-xl border-primary-deep text-primary-deep hover:bg-accent hover:text-primary-deep">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-xl bg-primary-deep hover:bg-primary-deep/90 text-white shadow-sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 py-8 px-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
             <Logo className="h-8 w-8 text-primary-deep" />
             <span className="text-lg font-headline text-primary-deep">Al-Huffaazh Academy</span>
          </div>
          <p className="text-sm text-gray-500 font-body">© {new Date().getFullYear()} Al-Huffaazh Academy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-gray-500 hover:text-primary-deep"><Twitter size={20} /></Link>
            <Link href="#" className="text-gray-500 hover:text-primary-deep"><Facebook size={20} /></Link>
            <Link href="#" className="text-gray-500 hover:text-primary-deep"><Instagram size={20} /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
