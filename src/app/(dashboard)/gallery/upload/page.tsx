

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { IKContext, IKUpload } from 'imagekitio-react';
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch.'),
  imageUrl: z.string().url('An image upload is required.'),
  caption: z.string().optional(),
});

interface Branch {
  id: string;
  name: string;
}

const imageKitAuthenticator = async () => {
    const response = await fetch('/api/imagekit/auth');
    const result = await response.json();
    return result;
};


export default function UploadGalleryImagePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const ikUploadRef = useRef<any>(null);

  const branchesQuery = useMemoFirebase(() => {
    return firestore ? collection(firestore, 'branches') : null;
  }, [firestore]);

  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchId: user?.role === 'branch_admin' ? user.branchId : '',
      imageUrl: '',
      caption: '',
    },
  });

  useEffect(() => {
    if (photoUrl) {
      form.setValue('imageUrl', photoUrl);
    }
  }, [photoUrl, form]);

  const onUploadSuccess = (ikResponse: any) => {
    setPhotoUrl(ikResponse.url);
    toast({
      title: 'Image Uploaded',
      description: "The image is ready. You can now add a caption and save.",
    });
    setIsUploading(false);
  };

  const onUploadError = (err: any) => {
    toast({
      variant: 'destructive',
      title: 'Upload Failed',
      description: err.message || 'Could not upload image.',
    });
    setIsUploading(false);
  };
  
  const onUploadStart = () => {
    setIsUploading(true);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    setIsSubmitting(true);

    try {
        await addDoc(collection(firestore, 'gallery'), {
            branchId: values.branchId,
            imageUrl: values.imageUrl,
            caption: values.caption || '',
            uploadedAt: serverTimestamp(),
            uploadedBy: user.uid,
        });

        toast({
            title: 'Success!',
            description: 'The new image has been added to the branch gallery.',
        });
        
        router.push('/dashboard');
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Failed to save image',
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const canUpload = user?.role === 'branch_admin' || user?.role === 'super_admin';

  if (!canUpload) {
    return (
        <Card>
            <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
            <CardContent><p>You do not have permission to upload gallery images.</p></CardContent>
        </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload to Gallery</CardTitle>
        <CardDescription>
          Add a new image to a branch's public gallery.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center gap-4">
                  <FormLabel>Gallery Image</FormLabel>
                   <FormControl>
                    <div className="w-full h-64 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center overflow-hidden bg-muted">
                      {photoUrl ? (
                         <Image src={photoUrl} alt="Gallery preview" width={400} height={256} className="object-contain w-auto h-full" />
                      ) : (
                        <span className="text-sm text-muted-foreground">Upload an image</span>
                      )}
                    </div>
                  </FormControl>
                  <IKContext
                    publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                    urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                    authenticator={imageKitAuthenticator}
                  >
                    <IKUpload
                      ref={ikUploadRef}
                      fileName={`gallery_${Date.now()}.jpg`}
                      folder="/gallery"
                      onUploadStart={onUploadStart}
                      onSuccess={onUploadSuccess}
                      onError={onUploadError}
                      style={{ display: 'none' }}
                    />
                     <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>
                       {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       {isUploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </IKContext>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={user?.role === 'branch_admin' || branchesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch for the image" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Caption (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 'Annual Sports Day 2024'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save to Gallery
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
