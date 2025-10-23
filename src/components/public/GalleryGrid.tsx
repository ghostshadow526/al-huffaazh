
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    const openModal = (index: number) => {
        setSelectedImage(index);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const nextImage = () => {
        if (selectedImage !== null) {
            setSelectedImage((selectedImage + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (selectedImage !== null) {
            setSelectedImage((selectedImage - 1 + images.length) % images.length);
        }
    };

    const currentImage = selectedImage !== null ? images[selectedImage] : null;

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                    ))
                ) : (
                    images.map((image, index) => (
                        <Card key={index} className="overflow-hidden cursor-pointer group" onClick={() => openModal(index)}>
                            <CardContent className="p-0">
                                <Image
                                    src={image.src}
                                    alt={image['data-ai-hint'] || `Gallery image ${index + 1}`}
                                    width={400}
                                    height={400}
                                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={image['data-ai-hint']}
                                />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog.Root open={selectedImage !== null} onOpenChange={(isOpen) => !isOpen && closeModal()}>
                 <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <Dialog.Content 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onPointerDownOutside={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                         <Dialog.Title className="sr-only">Enlarged Gallery Image</Dialog.Title>
                        {currentImage && (
                            <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center">
                                <Image
                                    src={currentImage.src}
                                    alt={currentImage['data-ai-hint'] || 'Enlarged gallery image'}
                                    width={1200}
                                    height={800}
                                    className="object-contain w-auto h-auto max-w-full max-h-full rounded-lg"
                                    data-ai-hint={currentImage['data-ai-hint']}
                                />

                                <Button variant="ghost" size="icon" onClick={closeModal} className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 text-white rounded-full z-50">
                                    <X className="h-6 w-6" />
                                </Button>
                                
                                <Button variant="ghost" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full z-50">
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>

                                <Button variant="ghost" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full z-50">
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
