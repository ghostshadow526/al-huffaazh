
'use client';

import { HeroSection } from '@/components/public/HeroSection';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BranchCard } from '@/components/public/BranchCard';
import { GalleryGrid } from '@/components/public/GalleryGrid';
import { ContactSection } from '@/components/public/ContactSection';
import Image from 'next/image';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string;
}

export default function MotherSitePage() {
  const firestore = useFirestore();

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'branches'), orderBy('name'), limit(3));
  }, [firestore]);

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gallery'), orderBy('uploadedAt', 'desc'), limit(6));
  }, [firestore]);


  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryImage>(galleryQuery);

  const galleryImages = galleryData?.map(img => ({ src: img.imageUrl, 'data-ai-hint': img.caption || 'school event' })) || [];


  return (
    <PublicLayout>
      <HeroSection />

      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">About Al-Huffaazh Academy</h2>
              <p className="text-lg text-gray-600 font-body">
                Al-Huffaazh Academy is a leading institution dedicated to providing an exceptional blend of Islamic and Western education. Our core mission is to nurture the next generation of scholars and leaders who are not only proficient in modern sciences but are also deeply rooted in the teachings of the Holy Quran.
              </p>
              <p className="text-gray-600 font-body">
                We believe in creating a disciplined, faith-based environment where students can thrive academically, morally, and spiritually. Our curriculum is designed to foster critical thinking, creativity, and a lifelong love for learning, all within a framework of Islamic values.
              </p>
            </div>
            <div>
              <Image 
                src="https://picsum.photos/seed/about1/600/400"
                alt="Students in a classroom"
                width={600}
                height={400}
                className="rounded-2xl shadow-lg"
                data-ai-hint="students classroom"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="branches" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Our Branches</h2>
            <p className="text-lg text-gray-600 mt-2 font-body">Find an Al-Huffaazh Academy near you.</p>
          </div>
          {branchesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => <Card key={i} className="rounded-2xl shadow-md"><CardContent className="p-6 h-48 animate-pulse bg-gray-200 rounded-2xl"></CardContent></Card>)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {branches?.map(branch => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          )}
           <div className="text-center mt-12">
                <Button asChild size="lg" className="rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                    <Link href="/branches">View All Branches</Link>
                </Button>
            </div>
        </div>
      </section>

      <section id="gallery" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Gallery</h2>
                  <p className="text-lg text-gray-600 mt-2 font-body">A glimpse into life at Al-Huffaazh Academy.</p>
              </div>
              <GalleryGrid images={galleryImages} isLoading={galleryLoading}/>
          </div>
      </section>
      
      <ContactSection />
      
    </PublicLayout>
  );
}
