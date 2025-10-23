
import React from 'react';
import Link from 'next/link';
import { Logo } from '../logo';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Branches', href: '#branches' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen font-body bg-white text-gray-800">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-10 w-10 text-primary-deep" />
              <span className="text-2xl font-bold text-primary-deep font-headline">
                Al-Huffaazh Academy
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <Link key={link.name} href={link.href} className="text-gray-600 hover:text-primary-deep transition-colors font-medium">
                    {link.name}
                </Link>
              ))}
            </nav>
            <Link href="/login" className="hidden md:inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-deep hover:bg-primary-deep/90">
                Portal Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-primary-deep text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
                <div>
                    <h3 className="font-bold font-headline text-lg mb-2">Al-Huffaazh Academy</h3>
                    <p className="text-sm text-primary-foreground/80">Nurturing faith and knowledge for a brighter future.</p>
                </div>
                 <div>
                    <h3 className="font-bold font-headline text-lg mb-2">Quick Links</h3>
                    <ul className="space-y-1 text-sm">
                        {navLinks.map(link => (
                            <li key={`footer-${link.name}`}>
                                <Link href={link.href} className="text-primary-foreground/80 hover:text-white transition-colors">{link.name}</Link>
                            </li>
                        ))}
                         <li>
                            <Link href="/login" className="text-primary-foreground/80 hover:text-white transition-colors">Portal Login</Link>
                        </li>
                    </ul>
                </div>
                 <div>
                    <h3 className="font-bold font-headline text-lg mb-2">Follow Us</h3>
                    <div className="flex justify-center md:justify-start gap-4">
                        <Link href="#" className="text-primary-foreground/80 hover:text-white"><Facebook size={20} /></Link>
                        <Link href="#" className="text-primary-foreground/80 hover:text-white"><Twitter size={20} /></Link>
                        <Link href="#" className="text-primary-foreground/80 hover:text-white"><Instagram size={20} /></Link>
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
                <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
