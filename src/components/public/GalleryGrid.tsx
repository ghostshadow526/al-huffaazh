
'use client';

import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface GalleryGridProps {
  images: { src: string; 'data-ai-hint'?: string }[];
  isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
    if (isLoading) {
        return (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square">
                        <Skeleton className="w-full h-full rounded-2xl" />
                    </div>
                ))}
            </div>
        )
    }

    if (!images || images.length === 0) {
        return <p className="text-center text-muted-foreground">No gallery images have been uploaded for this branch yet.</p>
    }

    return (
        <Dialog>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <DialogTrigger key={index} asChild>
                        <div className="aspect-square relative rounded-2xl overflow-hidden cursor-pointer group">
                             <Image
                                src={image.src}
                                alt={image['data-ai-hint'] || `Gallery image ${index + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={image['data-ai-hint'] || 'school event'}
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </DialogTrigger>
                ))}
            </div>
             <DialogContent className="max-w-4xl p-2 bg-transparent border-0">
                <Image 
                    src={images[0].src} // This will need to be dynamic if we want to click on any image
                    alt="Enlarged gallery view"
                    width={1200}
                    height={800}
                    className="rounded-lg object-contain w-full h-auto"
                />
            </DialogContent>
        </Dialog>
    );
}
