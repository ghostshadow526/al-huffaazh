
'use client';

import { useParams, notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { Phone, Mail, MapPin, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Branch {
  id: string;
  name: string;
  address: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
}

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string;
}

function BranchPageSkeleton() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-16 space-y-12">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-96 w-full rounded-2xl" />
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <Skeleton className="h-96 w-full rounded-2xl" />
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                  </div>
                </div>
                 <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        </PublicLayout>
    )
}


export default function BranchPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();

    // Fetch branch details based on slug
    const branchQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'branches'), where('slug', '==', slug));
    }, [firestore, slug]);

    const { data: branchData, isLoading: branchLoading } = useCollection<Branch>(branchQuery);
    const branch = branchData?.[0];
    
    // Fetch gallery images for this branch, ordered by upload date
    const galleryQuery = useMemoFirebase(() => {
        if (!firestore || !branch?.id) return null;
        return query(collection(firestore, 'gallery'), where('branchId', '==', branch.id), orderBy('uploadedAt', 'desc'));
    }, [firestore, branch?.id]);

    const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryImage>(galleryQuery);

    const galleryImages = galleryData?.map(img => ({ src: img.imageUrl, 'data-ai-hint': img.caption || 'school event' })) || [];
    
    if (branchLoading) {
        return <BranchPageSkeleton />;
    }

    // Only call notFound after loading is complete and we've confirmed the data isn't there
    if (!branchLoading && !branch) {
        return notFound();
    }
    
    if (!branch) {
      // This will be shown while branch is null but still loading.
      return <BranchPageSkeleton />;
    }

    return (
        <PublicLayout>
            {/* Branch Header */}
            <section className="py-20 md:py-28 bg-gray-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 h-full w-full">
                    <Image 
                        src={`https://picsum.photos/seed/${branch.slug}-header/1800/600`} 
                        alt={`${branch.name} header image`}
                        fill
                        style={{objectFit: 'cover'}}
                        className="opacity-10"
                        data-ai-hint="school building exterior"
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/50 to-transparent"></div>
                </div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary-deep">{branch.name}</h1>
                    <p className="text-lg md:text-xl text-gray-600 mt-2 font-body max-w-3xl mx-auto">{branch.address}</p>
                </div>
            </section>

            {/* About Branch Section */}
            <section id="branch-about" className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                       <Image 
                         src={`https://picsum.photos/seed/${branch.slug}-about/600/500`}
                         alt={`About ${branch.name}`}
                         width={600}
                         height={500}
                         className="rounded-2xl shadow-lg"
                         data-ai-hint="classroom students"
                       />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">About Our {branch.name}</h2>
                        <p className="text-gray-600 font-body leading-relaxed text-lg">
                            {branch.description || `Welcome to the ${branch.name} of Al-Huffaazh Academy. We are committed to providing the highest standards of Islamic and Western education. Our dedicated staff and modern facilities ensure that every student has the opportunity to reach their full potential in a supportive and nurturing environment.`}
                        </p>
                         <p className="text-gray-600 font-body leading-relaxed">
                            Our curriculum is designed to foster critical thinking, creativity, and a lifelong love for learning, all within a framework of Islamic values. Join us to be part of a community dedicated to excellence.
                        </p>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="branch-gallery" className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Branch Gallery</h2>
                        <p className="text-lg text-gray-600 mt-2 font-body">Moments from our recent events and activities.</p>
                    </div>
                    <GalleryGrid images={galleryImages} isLoading={galleryLoading} />
                     {galleryData && galleryData.length === 0 && !galleryLoading && (
                        <p className="text-center text-muted-foreground mt-8">No images have been uploaded for this branch yet.</p>
                    )}
                </div>
            </section>

            {/* Contact Section */}
            <section id="branch-contact" className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep mb-12">Contact Information</h2>
                    <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                            <MapPin size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Address</h3>
                            <p className="text-gray-600 text-center">{branch.address}</p>
                            <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} target="_blank" rel="noopener noreferrer">Get Directions</a>
                            </Button>
                        </div>
                         <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                            <Phone size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Phone</h3>
                            <p className="text-gray-600">{branch.phone || '+234 123 456 7890'}</p>
                             <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                                <a href={`tel:${branch.phone || '+2341234567890'}`}>Call Us</a>
                            </Button>
                        </div>
                         <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                            <Mail size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Email</h3>
                            <p className="text-gray-600 break-all">{branch.email || `${branch.slug}@alhuffaazh.com`}</p>
                             <Button variant="link" asChild className="mt-2 text-primary-deep font-semibold">
                                <a href={`mailto:${branch.email || branch.slug + '@alhuffaazh.com'}`}>Send an Email</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            
            <div className="py-12 text-center bg-white">
                 <Button asChild variant="outline" className="rounded-xl px-6 py-3 text-base">
                    <Link href="/branches">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Branches
                    </Link>
                </Button>
            </div>
        </PublicLayout>
    );
}

