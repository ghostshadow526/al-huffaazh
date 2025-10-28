'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const navLinks = [
    { href: '/branches/mariri', label: 'Home' },
    { href: '/branches/mariri/about', label: 'About Us' },
    { href: '/branches/mariri/gallery', label: 'Gallery' },
    { href: '/branches/mariri/contact', label: 'Contact' },
];

export default function MaririBranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/branches/mariri" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg text-primary-deep hidden sm:inline">
                Mariri Branch
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary font-semibold' : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
             <Button asChild variant="outline">
                <Link href="/branches">
                    <ArrowLeft className="mr-2 h-4 w-4" /> All Branches
                </Link>
            </Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
       <footer className="bg-primary-deep text-primary-foreground/80 py-12">
            <div className="container mx-auto px-4 text-center">
                 <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy - Mariri Branch. All Rights Reserved.</p>
                 <p className="text-sm mt-2">Part of the Al-Huffaazh Academy Network</p>
            </div>
      </footer>
    </div>
  );
}
