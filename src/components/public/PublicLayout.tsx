
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Facebook, Menu, X } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/branches', label: 'Branches' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
];

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-body flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white/80 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-10 w-10 text-primary" />
              <span className="font-bold font-headline text-xl text-primary-deep hidden sm:inline">
                Al-Huffaazh Academy
              </span>
            </Link>
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
                <Button asChild className="bg-primary-deep hover:bg-primary-deep/90">
                    <Link href="/login">Portal Login</Link>
                </Button>
            </div>
            <div className="md:hidden">
                <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-lg z-40">
                <nav className="flex flex-col items-center gap-4 p-4">
                    {navLinks.map((link) => (
                        <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'text-lg font-medium transition-colors hover:text-primary w-full text-center py-2 rounded-md',
                            pathname === link.href ? 'bg-accent text-primary font-semibold' : 'text-gray-600'
                        )}
                        onClick={() => setIsMenuOpen(false)}
                        >
                        {link.label}
                        </Link>
                    ))}
                    <Button asChild className="bg-primary-deep hover:bg-primary-deep/90 w-full mt-2">
                        <Link href="/login">Portal Login</Link>
                    </Button>
                </nav>
            </div>
        )}
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-primary-deep text-white">
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold font-headline mb-4">Al-Huffaazh Academy</h3>
                    <p className="text-gray-300 max-w-md">
                        A premier institution dedicated to nurturing faith and knowledge. We provide a balanced education, combining Islamic teachings with modern academic excellence to prepare students for success in this life and the hereafter.
                    </p>
                </div>
                <div>
                     <h3 className="text-lg font-semibold font-headline mb-4">Quick Links</h3>
                     <ul className="space-y-2">
                        <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                        <li><Link href="/branches" className="text-gray-300 hover:text-white transition-colors">Our Branches</Link></li>
                        <li><Link href="/gallery" className="text-gray-300 hover:text-white transition-colors">Gallery</Link></li>
                        <li><Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login to Portal</Link></li>
                     </ul>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold font-headline mb-4">Contact Us</h3>
                     <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-3">
                            <MapPin size={18} />
                            <span>Main Office, Jos, Nigeria</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <a href="https://wa.me/2349162829098" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                                <WhatsAppIcon />
                                <span>+234 916 282 9098</span>
                            </a>
                        </li>
                        <li className="flex items-center gap-3">
                           <a href="https://www.facebook.com/Alhuffaaz/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                                <Facebook size={18} />
                                <span>Follow on Facebook</span>
                            </a>
                        </li>
                     </ul>
                </div>
            </div>
             <div className="mt-12 pt-8 border-t border-primary/50 text-center text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

