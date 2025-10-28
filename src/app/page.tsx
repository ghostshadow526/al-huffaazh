
'use client';

import { HeroSection } from '@/components/public/HeroSection';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { BranchCard } from '@/components/public/BranchCard';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
}

export default function MotherSitePage() {
  const firestore = useFirestore();

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'branches'), orderBy('name'), limit(3));
  }, [firestore]);


  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);

  return (
    <PublicLayout>
      <HeroSection />

      {/* Our Mission Section */}
      <section id="mission" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Nurturing Faith & Knowledge</h2>
              <p className="text-lg text-gray-600 font-body leading-relaxed">
                Our mission is to provide an exceptional blend of authentic Islamic education and contemporary academic excellence. We are dedicated to cultivating a generation of leaders who are not only successful in their chosen fields but are also deeply rooted in their faith and moral character.
              </p>
              <ul className="space-y-2 pt-2">
                  <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">Holistic Quranic Memorization.</span>
                  </li>
                   <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">Excellence in modern academic subjects.</span>
                  </li>
                   <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">Strong moral and ethical development.</span>
                  </li>
              </ul>
            </div>
            <div>
              <Image 
                src="https://picsum.photos/seed/mission-image/600/500"
                alt="Students in a classroom"
                width={600}
                height={500}
                className="rounded-2xl shadow-lg"
                data-ai-hint="students classroom learning"
              />
            </div>
          </div>
      </section>

      {/* Beyond the Classroom Section */}
       <section id="excursions" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image 
                src="https://picsum.photos/seed/excursion-image/600/500"
                alt="Students on an excursion"
                width={600}
                height={500}
                className="rounded-2xl shadow-lg"
                data-ai-hint="students field trip"
              />
            </div>
            <div className="space-y-4 md:text-right">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Learning Beyond the Classroom</h2>
              <p className="text-lg text-gray-600 font-body leading-relaxed">
                Education at Al-Huffaazh Academy extends far beyond the four walls of a classroom. We believe in providing our students with practical, real-world experiences to enrich their learning.
              </p>
              <p className="text-gray-600 font-body leading-relaxed">
                Through regular educational excursions, science fairs, and community service projects, we encourage our students to explore their interests, develop new skills, and understand the practical application of their knowledge, preparing them to be inquisitive and engaged members of society.
              </p>
            </div>
          </div>
      </section>

      <section id="branches" className="py-16 md:py-24 bg-white">
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

      <section id="gallery" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
              <div className="mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Our Gallery</h2>
                  <p className="text-lg text-gray-600 mt-2 font-body">A glimpse into life at Al-Huffaazh Academy.</p>
              </div>
              <p className="max-w-2xl mx-auto text-gray-600 mb-8">
                We capture moments of learning, community, and joy. Our gallery showcases the vibrant life at our academies, from annual sports days to classroom activities.
              </p>
              <Button asChild size="lg" className="rounded-xl bg-primary-deep hover:bg-primary-deep/90">
                  <Link href="/gallery">View Full Gallery</Link>
              </Button>
          </div>
      </section>
      
    </PublicLayout>
  );
}
