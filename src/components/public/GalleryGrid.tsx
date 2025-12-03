'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImageProps {
  src: string;
  'data-ai-hint'?: string;
  caption?: string;
}

interface GalleryGridProps {
  images: GalleryImageProps[];
  isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleClose = () => {
    setSelectedImageIndex(null);
  };

  const handleNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-xl"
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.src}
              alt={image.caption || `Gallery image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              data-ai-hint={image['data-ai-hint']}
            />
             <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full p-2 sm:p-4 bg-transparent border-0 shadow-none">
            {selectedImage && (
                <div className="relative w-full h-auto">
                    <div className="relative aspect-video w-full">
                        <Image
                            src={selectedImage.src}
                            alt={selectedImage.caption || ''}
                            fill
                            className="object-contain rounded-lg"
                            sizes="100vw"
                        />
                    </div>
                    {selectedImage.caption && (
                        <p className="mt-4 text-center text-white bg-black/50 rounded-b-lg py-2 px-4">
                            {selectedImage.caption}
                        </p>
                    )}
                </div>
            )}
             <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                onClick={handlePrev}
             >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Previous Image</span>
             </Button>
             <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                onClick={handleNext}
             >
                <ChevronRight className="h-6 w-6" />
                <span className="sr-only">Next Image</span>
             </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}