
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AuthProvider from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Al-Huffaazh Academy',
  description: 'A premier institution for Islamic and Western education.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
