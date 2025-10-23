
'use client';

import { PublicLayout } from "@/components/public/PublicLayout";
import { GalleryGrid } from "@/components/public/GalleryGrid";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string;
}

export default function GalleryPage() {
    const firestore = useFirestore();

    const galleryQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'gallery'), orderBy('uploadedAt', 'desc'));
    }, [firestore]);

    const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryImage>(galleryQuery);

    const galleryImages = galleryData?.map(img => ({ src: img.imageUrl, 'data-ai-hint': img.caption || 'school event' })) || [];

    return (
        <PublicLayout>
            <section className="py-16 md:py-24 bg-gray-50">
                 <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">Photo Gallery</h1>
                        <p className="text-lg text-gray-600 mt-2 font-body">Capturing moments of learning, faith, and community across our branches.</p>
                    </div>
                    <GalleryGrid images={galleryImages} isLoading={galleryLoading} />
                     {galleryData && galleryData.length === 0 && !galleryLoading && (
                        <p className="text-center text-muted-foreground mt-8">No images have been uploaded to the gallery yet. Please check back later.</p>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
