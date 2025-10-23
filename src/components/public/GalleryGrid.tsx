
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface GalleryImage {
  src: string;
  [key: string]: any; 
}

interface GalleryGridProps {
  images: GalleryImage[];
  isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return <p className="text-center text-muted-foreground">No images in the gallery yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => setSelectedImage(image.src)}
          >
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <Image
                  src={image.src}
                  alt={`Gallery image ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  {...image}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-4">
          {selectedImage && (
            <div className="relative aspect-[16/10]">
              <Image
                src={selectedImage}
                alt="Selected gallery image"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
