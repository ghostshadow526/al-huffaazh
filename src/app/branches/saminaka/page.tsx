'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Building } from 'lucide-react';

export default function SaminakaHomePage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gray-800 text-white flex items-center justify-center">
        <Image
          src="https://picsum.photos/seed/saminaka-hero/1800/800"
          alt="Saminaka Branch"
          fill
          className="object-cover opacity-30"
          data-ai-hint="school campus building"
        />
        <div className="relative z-10 text-center px-4 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline">
            Welcome to Saminaka Branch
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto">
            A center of excellence for Islamic and Western education in the heart of the community.
          </p>
          <Button size="lg" asChild>
            <Link href="/branches/saminaka/contact">Enroll Now</Link>
          </Button>
        </div>
      </section>
      
      {/* Introduction Section */}
      <section className="container mx-auto px-4">
         <Card className="shadow-lg -mt-32 relative z-20 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                    <Users className="h-10 w-10 mx-auto text-primary"/>
                    <h3 className="text-2xl font-bold">Expert Tutors</h3>
                    <p className="text-muted-foreground">Learn from dedicated teachers with years of experience.</p>
                </div>
                 <div className="space-y-2">
                    <BookOpen className="h-10 w-10 mx-auto text-primary"/>
                    <h3 className="text-2xl font-bold">Balanced Curriculum</h3>
                    <p className="text-muted-foreground">Integrating Quranic studies with modern academic subjects.</p>
                </div>
                 <div className="space-y-2">
                    <Building className="h-10 w-10 mx-auto text-primary"/>
                    <h3 className="text-2xl font-bold">Modern Facilities</h3>
                    <p className="text-muted-foreground">A safe and supportive environment for optimal learning.</p>
                </div>
            </CardContent>
         </Card>
      </section>

      {/* Quick Links Section */}
      <section className="container mx-auto px-4 text-center">
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>About Our Branch</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">Discover our mission, vision, and the values that guide us.</p>
                    <Button asChild>
                        <Link href="/branches/saminaka/about">Learn More</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>Our Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">See moments from our school events, activities, and daily life.</p>
                    <Button asChild>
                        <Link href="/branches/saminaka/gallery">View Gallery</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
