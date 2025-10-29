
'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Facebook, Phone, Mail, MapPin } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/branches', label: 'Branches' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg text-primary-deep hidden sm:inline">
                Al-Huffaazh Academy
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href
                      ? 'text-primary font-semibold'
                      : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Button asChild>
              <Link href="/login">Portal Login</Link>
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-primary-deep text-primary-foreground/80 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* About Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Logo className="h-10 w-10 text-white" />
                <h3 className="text-xl font-bold text-white font-headline">
                  Al-Huffaazh Academy
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed max-w-md">
                A leading institution for Islamic and Western education,
                dedicated to nurturing the next generation of scholars and
                leaders.
              </p>
            </div>

            {/* Quick Links Section */}
            <div>
              <h4 className="text-lg font-semibold text-white font-headline mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Section */}
            <div>
              <h4 className="text-lg font-semibold text-white font-headline mb-4">
                Contact Us
              </h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-3">
                  <MapPin size={18} />
                  <span>P.O.Box 006, New Bauchi Road Saminaka, Saminaka, Nigeria</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} />
                  <a href="tel:08032719772" className="hover:text-white hover:underline">
                    0803 271 9772
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} />
                  <a
                    href="mailto:info@alhuffaazh.com"
                    className="hover:text-white hover:underline"
                  >
                    info@alhuffaazh.com
                  </a>
                </li>
              </ul>
              <div className="flex items-center gap-4 mt-6">
                 <a href="https://wa.me/2348145959838" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    <Phone />
                    <span className="sr-only">WhatsApp</span>
                 </a>
                 <a href="#" className="text-gray-300 hover:text-white">
                    <Facebook />
                    <span className="sr-only">Facebook</span>
                 </a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-primary-foreground/20 pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights
              Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

    