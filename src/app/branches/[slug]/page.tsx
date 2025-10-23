
'use client';

import { useParams, notFound } from "next/navigation";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
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
    
    // Fetch gallery images for this branch
    const galleryQuery = useMemoFirebase(() => {
        if (!firestore || !branch?.id) return null;
        return query(collection(firestore, 'gallery'), where('branchId', '==', branch.id));
    }, [firestore, branch?.id]);

    const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryImage>(galleryQuery);

    const galleryImages = galleryData?.map(img => ({ src: img.imageUrl, 'data-ai-hint': img.caption || 'school event' })) || [];
    
    if (branchLoading) {
        return (
            <PublicLayout>
                <div className="container mx-auto px-4 py-16 space-y-12">
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </PublicLayout>
        )
    }

    if (!branch) {
        // Wait for loading to finish before showing not found
        if (!branchLoading) return notFound();
        return null;
    }

    return (
        <PublicLayout>
            {/* Branch Header */}
            <section className="py-16 md:py-24 bg-gray-50 relative">
                <div className="absolute inset-0 -z-10 h-full w-full">
                    <Image 
                        src={`https://picsum.photos/seed/${slug}header/1800/600`} 
                        alt={`${branch.name} header`}
                        fill
                        style={{objectFit: 'cover'}}
                        className="opacity-10"
                        data-ai-hint="school building exterior"
                    />
                </div>
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">{branch.name}</h1>
                    <p className="text-lg text-gray-600 mt-2 font-body">{branch.address}</p>
                </div>
            </section>

            {/* About Branch Section */}
            <section id="branch-about" className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                       <Image 
                         src={`https://picsum.photos/seed/${slug}about/600/500`}
                         alt={`About ${branch.name}`}
                         width={600}
                         height={500}
                         className="rounded-2xl shadow-lg"
                         data-ai-hint="classroom teaching"
                       />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">About Our {branch.name}</h2>
                        <p className="text-gray-600 font-body">
                            {branch.description || `Welcome to the ${branch.name} of Al-Huffaazh Academy. We are committed to providing the highest standards of education and spiritual guidance to our students in a supportive and nurturing environment. Our dedicated staff and modern facilities ensure that every student has the opportunity to reach their full potential.`}
                        </p>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="branch-gallery" className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep">Branch Gallery</h2>
                    </div>
                    {galleryLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {[...Array(3)].map((_, i) => <Skeleton key={i} className="rounded-2xl h-64 bg-gray-200" />)}
                        </div>
                    ) : galleryImages.length > 0 ? (
                        <GalleryGrid images={galleryImages} />
                    ) : (
                        <p className="text-center text-gray-500">No gallery images have been uploaded for this branch yet.</p>
                    )}
                </div>
            </section>

            {/* Contact Section */}
            <section id="branch-contact" className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-deep mb-12">Contact Information</h2>
                    <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm">
                            <MapPin size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Address</h3>
                            <p className="text-gray-600">{branch.address}</p>
                            <Button variant="link" asChild className="mt-2 text-primary-deep">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} target="_blank" rel="noopener noreferrer">Get Directions</a>
                            </Button>
                        </div>
                         <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm">
                            <Phone size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Phone</h3>
                            <p className="text-gray-600">{branch.phone || '+234 (803) 123-4567'}</p>
                        </div>
                         <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm">
                            <Mail size={32} className="text-primary-deep mb-3"/>
                            <h3 className="font-semibold font-headline text-lg">Email</h3>
                            <p className="text-gray-600">{branch.email || `contact.${branch.slug}@alhuffaazh.com`}</p>
                        </div>
                    </div>
                </div>
            </section>
            
            <div className="py-8 text-center bg-white">
                 <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/branches">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Branches
                    </Link>
                </Button>
            </div>
        </PublicLayout>
    );
}
