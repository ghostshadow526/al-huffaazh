'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { GalleryGrid } from "@/components/public/GalleryGrid";

interface GalleryImage {
    id: string;
    imageUrl: string;
    caption?: string;
}

export default function SaminakaGalleryPage() {
    const firestore = useFirestore();
    const branchSlug = 'saminaka-branch';

    const galleryQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'gallery'), 
            where('branchId', '==', branchSlug), 
            orderBy('uploadedAt', 'desc')
        );
    }, [firestore]);

    const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryImage>(galleryQuery);

    const galleryImages = galleryData?.map(img => ({ src: img.imageUrl, 'data-ai-hint': img.caption || 'school event' })) || [];

    return (
        <div className="bg-gray-50 py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary-deep">Branch Gallery</h1>
                    <p className="text-lg text-gray-600 mt-2 font-body">Capturing moments at Saminaka Branch</p>
                </div>
                <GalleryGrid images={galleryImages} isLoading={galleryLoading} />
                {galleryData && galleryData.length === 0 && !galleryLoading && (
                    <p className="text-center text-muted-foreground mt-8">No images have been uploaded for this branch yet.</p>
                )}
            </div>
        </div>
    );
}
