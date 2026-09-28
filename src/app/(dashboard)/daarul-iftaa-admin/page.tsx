'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Video, 
  Image as ImageIcon, 
  BookOpen, 
  PlusCircle, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Database, 
  CheckCircle,
  ShieldAlert,
  Play
} from 'lucide-react';

interface MediaRecord {
  id: string;
  type: 'video' | 'picture' | 'fatwa';
  title: string;
  description?: string;
  url?: string;
  category?: string;
  speaker?: string;
  duration?: string;
  date?: string;
  question?: string;
  verdict?: string;
  reference?: string;
  createdBy?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

const VIDEO_CATEGORIES = [
  'Tafseer & Quran Sciences',
  'Fiqh & Jurisprudence',
  'Hadith & Sunnah',
  'Aqeedah & Islamic Creed',
  'Tarbiyyah & Family Guidance',
  'Youth & Student Discourse',
  'Friday Khutbah & Sermons',
  'Special Symposium',
];

const PICTURE_CATEGORIES = [
  'Graduation & Tawafeeq',
  'Scholarly Assemblies',
  'Halaqat & Classroom Learning',
  'Competitions & Awards',
  'Community Outreach',
  'Seminars & Conferences',
];

export default function DaarulIftaaAdminPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeFormTab, setActiveFormTab] = useState<'video' | 'picture' | 'fatwa'>('video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Video Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSpeaker, setVideoSpeaker] = useState('');
  const [videoCategory, setVideoCategory] = useState(VIDEO_CATEGORIES[0]);
  const [videoDuration, setVideoDuration] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  // Picture Form State
  const [pictureTitle, setPictureTitle] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [pictureCategory, setPictureCategory] = useState(PICTURE_CATEGORIES[0]);
  const [pictureDescription, setPictureDescription] = useState('');

  // Fatwa Form State
  const [fatwaTitle, setFatwaTitle] = useState('');
  const [fatwaCategory, setFatwaCategory] = useState('General Islamic Ruling');
  const [fatwaQuestion, setFatwaQuestion] = useState('');
  const [fatwaVerdict, setFatwaVerdict] = useState('');
  const [fatwaReference, setFatwaReference] = useState('');

  // Firestore Media Query
  const mediaQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'daarul_iftaa_media');
  }, [firestore, user]);

  const { data: mediaItems, isLoading } = useCollection<MediaRecord>(mediaQuery);

  // Picture file upload via ImageKit auth
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const authRes = await fetch('/api/imagekit/auth');
      const authData = await authRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `daarul-iftaa-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
      formData.append('publicKey', authData.publicKey || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '');
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);
      formData.append('folder', '/daarul-iftaa');

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadJson = await uploadRes.json();
        setPictureUrl(uploadJson.url);
        toast({ title: 'Image Uploaded', description: 'Picture uploaded and ready to publish.' });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPictureUrl(reader.result as string);
          toast({ title: 'Local Image Ready', description: 'Image attached.' });
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictureUrl(reader.result as string);
        toast({ title: 'Image Processed', description: 'Image attached.' });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    if (!videoTitle.trim() || !videoUrl.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Title and Video URL are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'daarul_iftaa_media'), {
        type: 'video',
        title: videoTitle.trim(),
        url: videoUrl.trim(),
        speaker: videoSpeaker.trim() || 'Al-Huffaazh Scholar',
        category: videoCategory,
        duration: videoDuration.trim() || undefined,
        description: videoDescription.trim() || undefined,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdBy: user.fullName || user.email,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Video Published', description: `${videoTitle} is now live on the Daarul Iftaa page.` });
      setVideoTitle('');
      setVideoUrl('');
      setVideoSpeaker('');
      setVideoDuration('');
      setVideoDescription('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to add video.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Picture
  const handleAddPicture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    if (!pictureTitle.trim() || !pictureUrl.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Title and Picture URL/File are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'daarul_iftaa_media'), {
        type: 'picture',
        title: pictureTitle.trim(),
        url: pictureUrl.trim(),
        category: pictureCategory,
        description: pictureDescription.trim() || undefined,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdBy: user.fullName || user.email,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Picture Published', description: `${pictureTitle} added to Daarul Iftaa gallery.` });
      setPictureTitle('');
      setPictureUrl('');
      setPictureDescription('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to add picture.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Fatwa
  const handleAddFatwa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    if (!fatwaTitle.trim() || !fatwaVerdict.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Fatwa Title and Verdict are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'daarul_iftaa_media'), {
        type: 'fatwa',
        title: fatwaTitle.trim(),
        category: fatwaCategory.trim(),
        question: fatwaQuestion.trim() || undefined,
        verdict: fatwaVerdict.trim(),
        reference: fatwaReference.trim() || 'Daarul Iftaa Council',
        date: format(new Date(), 'yyyy-MM-dd'),
        createdBy: user.fullName || user.email,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Fatwa Published', description: `Fatwa verdict published successfully.` });
      setFatwaTitle('');
      setFatwaQuestion('');
      setFatwaVerdict('');
      setFatwaReference('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to add fatwa.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (!firestore) return;
    if (!confirm(`Are you sure you want to remove "${itemTitle}"?`)) return;

    setIsDeleting(itemId);
    try {
      await deleteDoc(doc(firestore, 'daarul_iftaa_media', itemId));
      toast({ title: 'Item Removed', description: `"${itemTitle}" has been deleted.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to delete.' });
    } finally {
      setIsDeleting(null);
    }
  };

  // Access restriction
  if (user && user.role !== 'daarul_iftaa' && user.role !== 'super_admin') {
    return (
      <Card className="max-w-2xl mx-auto my-12 border-destructive/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Daarul Iftaa Admin Only</CardTitle>
          <CardDescription className="text-base mt-2">
            This backend portal is restricted to authorized Daarul Iftaa administrators and the Super Admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" /> Daarul Iftaa Content Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Backend control panel to publish and manage scholarly video lectures, picture galleries, and authentic Fatawa for the public academy portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-medium">
            Role: Daarul Iftaa Admin
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a href="/daarul-iftaa" target="_blank" rel="noopener noreferrer">
              View Public Page <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Database Hook Note Card */}
      <Card className="bg-slate-900 text-white border-slate-800 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-400">
              <Database className="h-5 w-5" /> Media Database Storage Connector
            </CardTitle>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs">
              Live & Synchronized
            </Badge>
          </div>
          <CardDescription className="text-slate-300 text-xs mt-1">
            All content uploaded below is directly linked to the Academy repository (<code>daarul_iftaa_media</code>). Whenever you supply your custom database or video streaming URL, it will connect seamlessly here.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload & Add Media Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" /> Add New Islamic Content
          </CardTitle>
          <CardDescription>
            Choose the content type to publish to the Daarul Iftaa portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFormTab} onValueChange={(val) => setActiveFormTab(val as any)}>
            <TabsList className="grid grid-cols-3 max-w-md mb-6">
              <TabsTrigger value="video" className="flex items-center gap-1.5">
                <Video className="h-4 w-4" /> Add Video
              </TabsTrigger>
              <TabsTrigger value="picture" className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" /> Add Picture
              </TabsTrigger>
              <TabsTrigger value="fatwa" className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> Add Fatwa
              </TabsTrigger>
            </TabsList>

            {/* Video Form */}
            <TabsContent value="video">
              <form onSubmit={handleAddVideo} className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="vid-title">Video Title *</Label>
                  <Input
                    id="vid-title"
                    placeholder="e.g. Fiqh of Purification & Salah in Modern Times"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vid-url">Video URL (YouTube, Vimeo, MP4 direct) *</Label>
                    <Input
                      id="vid-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vid-speaker">Speaker / Sheikh Name</Label>
                    <Input
                      id="vid-speaker"
                      placeholder="e.g. Sheikh Dr. Ahmad Al-Huffaazi"
                      value={videoSpeaker}
                      onChange={(e) => setVideoSpeaker(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vid-cat">Category</Label>
                    <Select value={videoCategory} onValueChange={setVideoCategory}>
                      <SelectTrigger id="vid-cat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vid-duration">Duration (Optional)</Label>
                    <Input
                      id="vid-duration"
                      placeholder="e.g. 45 mins"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vid-desc">Lecture Synopsis / Description</Label>
                  <Textarea
                    id="vid-desc"
                    placeholder="Brief summary of the lecture contents and scholarly references discussed..."
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Video to Daarul Iftaa
                </Button>
              </form>
            </TabsContent>

            {/* Picture Form */}
            <TabsContent value="picture">
              <form onSubmit={handleAddPicture} className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="pic-title">Picture Title *</Label>
                  <Input
                    id="pic-title"
                    placeholder="e.g. Memorization Completion Ceremony 2024"
                    value={pictureTitle}
                    onChange={(e) => setPictureTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pic-url">Picture Image URL</Label>
                    <Input
                      id="pic-url"
                      placeholder="https://... or upload below"
                      value={pictureUrl}
                      onChange={(e) => setPictureUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pic-cat">Category</Label>
                    <Select value={pictureCategory} onValueChange={setPictureCategory}>
                      <SelectTrigger id="pic-cat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PICTURE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pic-file">Or Upload Image File</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="pic-file"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  </div>
                </div>

                {pictureUrl && (
                  <div className="p-3 border rounded-lg max-w-xs bg-muted/20">
                    <img src={pictureUrl} alt="Preview" className="h-36 w-full object-cover rounded" />
                    <p className="text-xs text-muted-foreground mt-1 truncate">Image Ready</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pic-desc">Description / Event Caption</Label>
                  <Textarea
                    id="pic-desc"
                    placeholder="Description of the event or program..."
                    value={pictureDescription}
                    onChange={(e) => setPictureDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting || !pictureUrl} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Picture to Gallery
                </Button>
              </form>
            </TabsContent>

            {/* Fatwa Form */}
            <TabsContent value="fatwa">
              <form onSubmit={handleAddFatwa} className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="fat-title">Fatwa Topic / Ruling Title *</Label>
                  <Input
                    id="fat-title"
                    placeholder="e.g. Permissibility of Cooperative Educational Funds"
                    value={fatwaTitle}
                    onChange={(e) => setFatwaTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fat-cat">Category / Field of Jurisprudence</Label>
                    <Input
                      id="fat-cat"
                      placeholder="e.g. Commercial Fiqh, Family Fiqh, Worship"
                      value={fatwaCategory}
                      onChange={(e) => setFatwaCategory(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat-ref">Council Reference / Scholar</Label>
                    <Input
                      id="fat-ref"
                      placeholder="e.g. Verdict #2024-11, Council of Scholars"
                      value={fatwaReference}
                      onChange={(e) => setFatwaReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat-q">Question / Situation Posed</Label>
                  <Textarea
                    id="fat-q"
                    placeholder="Enter the community question or inquiry..."
                    value={fatwaQuestion}
                    onChange={(e) => setFatwaQuestion(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat-v">Scholarly Verdict & Evidences *</Label>
                  <Textarea
                    id="fat-v"
                    placeholder="State the Islamic ruling clearly with references to Quran, Hadith, and classical scholarly consensus..."
                    value={fatwaVerdict}
                    onChange={(e) => setFatwaVerdict(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Fatwa Verdict
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Published Content Ledger */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Published Media & Content Ledger</span>
            <Badge variant="outline" className="font-mono text-xs">
              {mediaItems ? mediaItems.length : 0} Items
            </Badge>
          </CardTitle>
          <CardDescription>
            All active video discourses, gallery photos, and Fatawa currently displayed on the Daarul Iftaa public portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category / Details</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : mediaItems && mediaItems.length > 0 ? (
                  mediaItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={
                            item.type === 'video' 
                              ? 'bg-blue-100 text-blue-800' 
                              : item.type === 'picture' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{item.category || 'General'}</div>
                        {item.speaker && <div className="text-slate-700 font-medium">{item.speaker}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.date || 'Recent'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.createdBy || 'Daarul Iftaa'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex gap-2 justify-end items-center">
                          {item.url && (
                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> View
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            disabled={isDeleting === item.id}
                            className="h-7 text-xs"
                          >
                            {isDeleting === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                      No custom media uploaded yet. Use the form above to add your first lecture, photo, or fatwa.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
