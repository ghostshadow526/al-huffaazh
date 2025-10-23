
'use client';

import Link from "next/link";
import { Button } from "../ui/button";
import { Logo } from "../logo";
import { Mail, MapPin, Phone } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary-deep" />
            <span className="font-bold text-xl text-primary-deep font-headline">Al-Huffaazh Academy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground/70 hover:text-foreground">Home</Link>
            <Link href="/#about" className="text-foreground/70 hover:text-foreground">About</Link>
            <Link href="/branches" className="text-foreground/70 hover:text-foreground">Branches</Link>
            <Link href="/gallery" className="text-foreground/70 hover:text-foreground">Gallery</Link>
            <Link href="/#contact" className="text-foreground/70 hover:text-foreground">Contact</Link>
          </nav>
          <Button asChild>
            <Link href="/login">Portal Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary-deep text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* About Section */}
                <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <Logo className="h-10 w-10 text-accent" />
                        <h3 className="text-2xl font-bold font-headline">Al-Huffaazh Academy</h3>
                    </div>
                    <p className="text-gray-300">
                        A premier institution dedicated to nurturing faith and knowledge. We provide a balanced education, combining Islamic teachings with modern academic excellence to prepare students for success in this life and the hereafter.
                    </p>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-lg font-semibold font-headline mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link href="/#about" className="text-gray-300 hover:text-white">About Us</Link></li>
                        <li><Link href="/branches" className="text-gray-300 hover:text-white">Our Branches</Link></li>
                        <li><Link href="/gallery" className="text-gray-300 hover:text-white">Gallery</Link></li>
                        <li><Link href="/login" className="text-gray-300 hover:text-white">Login to Portal</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-lg font-semibold font-headline mb-4">Contact Us</h4>
                    <ul className="mt-4 space-y-2 text-gray-300">
                        <li className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>Main Office, Jos, Nigeria</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone size={16} />
                            <span>+234 123 456 7890</span>
                        </li>
                         <li className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>contact@alhuffaazh.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/50 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} Al-Huffaazh Academy. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
