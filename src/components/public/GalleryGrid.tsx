
'use client';

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";

interface Image {
    src: string;
    'data-ai-hint'?: string;
}

interface GalleryGridProps {
    images: Image[];
    isLoading: boolean;
}

export function GalleryGrid({ images, isLoading }: GalleryGridProps) {
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

    const openModal = (image: Image) => {
        setSelectedImage(image);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    if (isLoading) {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square">
                        <Skeleton className="w-full h-full rounded-xl" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div 
                        key={index}
                        className="aspect-square relative group overflow-hidden rounded-xl cursor-pointer"
                        onClick={() => openModal(image)}
                    >
                        <Image
                            src={image.src}
                            alt={image['data-ai-hint'] || `Gallery image ${index + 1}`}
                            fill
                            style={{objectFit: 'cover'}}
                            className="transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                ))}
            </div>

            <Dialog open={selectedImage !== null} onOpenChange={(isOpen) => !isOpen && closeModal()}>
                 <DialogPortal>
                    <DialogOverlay className="fixed inset-0 bg-black/80 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogContent 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onPointerDownOutside={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <DialogTitle className="sr-only">Enlarged Gallery Image</DialogTitle>
                        {selectedImage && (
                            <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
                                 <Image
                                    src={selectedImage.src}
                                    alt={selectedImage['data-ai-hint'] || 'Enlarged gallery image'}
                                    fill
                                    style={{objectFit: 'contain'}}
                                />
                            </div>
                        )}
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        </div>
    );
}

