
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GalleryImageProps {
  src: string;
  'data-ai-hint'?: string;
}

interface GalleryGridProps {
  images: GalleryImageProps[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <Dialog>
        {images.map((image, index) => (
          <DialogTrigger asChild key={index}>
             <div className="group relative aspect-w-4 aspect-h-3 overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
                <Image
                    src={image.src}
                    alt={image['data-ai-hint'] || `Gallery image ${index + 1}`}
                    fill
                    style={{objectFit: 'cover'}}
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={image['data-ai-hint']}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </DialogTrigger>
        ))}
         <DialogContent className="max-w-4xl p-0 border-0 bg-transparent">
            {/* For simplicity, we are not implementing a full carousel, but this shows the first clicked image */}
            {/* A more advanced implementation could use a state to track the selected image */}
            {images.length > 0 && 
                <Image 
                    src={images[0].src} 
                    alt="Enlarged view" 
                    width={1200} 
                    height={800} 
                    className="w-full h-auto rounded-lg"
                />
            }
        </DialogContent>
      </Dialog>
    </div>
  );
}
