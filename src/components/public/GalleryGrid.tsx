
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  src: string;
  'data-ai-hint'?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => (prevIndex === null || prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => (prevIndex === null || prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);


  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="group relative" onClick={() => openLightbox(index)}>
            <Image
              src={image.src}
              alt={`Gallery image ${index + 1}`}
              width={400}
              height={400}
              className="object-cover w-full h-64 rounded-lg cursor-pointer transition-transform transform group-hover:scale-105"
              data-ai-hint={image['data-ai-hint']}
            />
             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <p className="text-white font-bold">View</p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedIndex !== null && (
        <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-0 bg-transparent shadow-none flex items-center justify-center">
            <div className="relative w-full h-full">
               <Image
                 src={images[selectedIndex].src}
                 alt={`Gallery image ${selectedIndex + 1}`}
                 fill
                 className="object-contain"
               />

               <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
               >
                 <ChevronLeft className="h-8 w-8" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={goToNext}
                 className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
               >
                 <ChevronRight className="h-8 w-8" />
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
