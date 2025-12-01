

'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound } from 'lucide-react';
import Image from 'next/image';
import { resetUserPassword } from '@/app/actions/user-actions';
import { Separator } from '@/components/ui/separator';

const imageKitAuthenticator = async () => {
    const response = await fetch('/api/imagekit/auth');
    const result = await response.json();
    return result;
};

function getInitials(name?: string | null) {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
    const ikUploadRef = useRef<any>(null);

    const onUploadStart = () => {
        setIsUploading(true);
    };

    const onUploadSuccess = (ikResponse: any) => {
        setNewPhotoUrl(ikResponse.url);
        toast({
            title: 'Photo Uploaded',
            description: "Your new profile photo is ready. Click 'Save Changes' to apply it.",
        });
        setIsUploading(false);
    };

    const onUploadError = (err: any) => {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: err.message || 'Could not upload photo. Please try again.',
        });
        setIsUploading(false);
    };

    const handleSaveChanges = async () => {
        if (!user || !firestore || !newPhotoUrl) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save changes. User or photo not available.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                photoURL: newPhotoUrl,
            });
            toast({
                title: 'Profile Updated',
                description: 'Your profile picture has been successfully updated. It may take a moment to reflect everywhere.',
            });
            // Optionally force a reload or wait for the AuthProvider to update
            window.location.reload(); 
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Save',
                description: error.message || 'An error occurred while updating your profile.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return <p>Loading profile...</p>;
    }

    if (!user) {
        return <p>You must be logged in to view this page.</p>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>View and update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-2">
                            <AvatarImage src={newPhotoUrl || user.photoURL || ''} alt={user.fullName || 'User'} />
                            <AvatarFallback>{getInitials(user.fullName || user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">{user.fullName}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                            <p className="text-sm font-medium capitalize text-accent">{user.role?.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Update Profile Picture</Label>
                        {newPhotoUrl && (
                            <div className="p-2 border rounded-md">
                                <p className="text-sm text-muted-foreground mb-2">New Photo Preview:</p>
                                <Image src={newPhotoUrl} alt="New profile preview" width={100} height={100} className="rounded-md" />
                            </div>
                        )}
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                            authenticator={imageKitAuthenticator}
                        >
                            <IKUpload
                                ref={ikUploadRef}
                                fileName={`${user.uid}_profile.jpg`}
                                folder="/avatars"
                                onUploadStart={onUploadStart}
                                onSuccess={onUploadSuccess}
                                onError={onUploadError}
                                style={{ display: 'none' }}
                                useUniqueFileName={false}
                                isPrivateFile={false}
                                overwriteFile={true}
                            />
                        </IKContext>
                        <div className="flex items-center gap-4">
                             <Button type="button" variant="outline" onClick={() => ikUploadRef.current?.click()} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'Uploading...' : 'Choose New Photo'}
                            </Button>
                            <Button onClick={handleSaveChanges} disabled={isSaving || !newPhotoUrl}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                        <p className='text-xs text-muted-foreground'>Upload a new photo, then click Save Changes to apply it.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
