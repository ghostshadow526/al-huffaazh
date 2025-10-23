
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';

interface GalleryImage {
    src: string;
    'data-ai-hint': string;
}

export function GalleryGrid({ images, isLoading }: { images: GalleryImage[], isLoading?: boolean }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
    )
  }

  if (images.length === 0) {
      return (
          <p className="text-center text-muted-foreground h-40 flex items-center justify-center">
              No gallery images have been uploaded for this branch yet.
          </p>
      )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative h-64 w-full cursor-pointer overflow-hidden rounded-2xl shadow-md"
            onClick={() => setSelectedImage(image.src)}
          >
            <Image
              src={image.src}
              alt={image['data-ai-hint']}
              fill
              style={{objectFit: 'cover'}}
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={image['data-ai-hint']}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
            {selectedImage && (
                <div className="relative w-full h-[80vh]">
                    <Image
                        src={selectedImage}
                        alt="Selected gallery image"
                        fill
                        style={{objectFit: 'contain'}}
                        sizes="100vw"
                    />
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
