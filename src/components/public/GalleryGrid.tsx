
'use client';

import React, { useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface GalleryImage {
  src: string | StaticImageData;
  alt?: string;
  'data-ai-hint'?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-w-1 aspect-h-1 cursor-pointer overflow-hidden rounded-2xl shadow-lg"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={image.src}
              alt={image.alt || `Gallery image ${index + 1}`}
              fill
              style={{objectFit: 'cover'}}
              className="transform transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={image['data-ai-hint']}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 border-0">
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt || 'Selected gallery image'}
                fill
                style={{objectFit: 'contain'}}
                data-ai-hint={selectedImage['data-ai-hint']}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
