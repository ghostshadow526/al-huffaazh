
'use client';

import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface GalleryGridProps {
  images: { src: string; 'data-ai-hint': string }[];
  isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-md overflow-hidden aspect-w-1 aspect-h-1">
            <Skeleton className="h-full w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return <p className="text-center text-muted-foreground">No gallery images available yet.</p>;
  }

  return (
    <Dialog.Root>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {images.map((image, index) => (
            <Dialog.Trigger key={index} asChild>
                <div onClick={() => setSelectedImage(image.src)} className="cursor-pointer">
                    <Card className="rounded-2xl shadow-md overflow-hidden group transform transition-transform duration-300 hover:scale-105">
                        <CardContent className="p-0 relative aspect-[4/3]">
                        <Image
                            src={image.src}
                            alt={image['data-ai-hint'] || `Gallery image ${index + 1}`}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="transition-opacity duration-300 group-hover:opacity-90"
                            data-ai-hint={image['data-ai-hint']}
                        />
                        </CardContent>
                    </Card>
                </div>
            </Dialog.Trigger>
        ))}
        </div>
         <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content 
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onPointerDownOutside={(e) => {
                    if (e.target === e.currentTarget) {
                        setSelectedImage(null)
                    }
                }}
            >
            {selectedImage && (
                <div className="relative max-w-4xl max-h-[90vh]">
                     <img src={selectedImage} alt="Enlarged view" className="object-contain w-full h-full rounded-lg shadow-2xl" />
                     <Dialog.Close asChild>
                         <Button variant="ghost" size="icon" className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30" onClick={() => setSelectedImage(null)}>
                            <X size={24} />
                         </Button>
                    </Dialog.Close>
                </div>
            )}
            </Dialog.Content>
         </Dialog.Portal>
    </Dialog.Root>
  );
}

