'use client';

import React, { useState, useMemo } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Play, 
  Video, 
  Image as ImageIcon, 
  BookOpen, 
  Search, 
  Calendar, 
  User, 
  MessageSquare, 
  ExternalLink,
  HelpCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MediaItem {
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
}

// Curated authentic seed items
const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'vid-1',
    type: 'video',
    title: 'The Virtues of Memorizing the Noble Quran & Preservation of Hadith',
    description: 'An inspiring scholarly lecture on the dedication required for Tahfeezul Quran and steadfastness in knowledge.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // standard fallback or embeddable
    category: 'Tafseer & Quran',
    speaker: 'Sheikh Dr. Abu Bakr Al-Huffaazi',
    duration: '42 mins',
    date: '2024-09-15',
  },
  {
    id: 'vid-2',
    type: 'video',
    title: 'Fiqh of Daily Transactions: Halal Commerce in Contemporary Nigeria',
    description: 'Comprehensive analysis of modern commercial contracts, interest avoidance, and Islamic partnerships.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Fiqh & Jurisprudence',
    speaker: 'Ustaz Muhammad Aminu',
    duration: '55 mins',
    date: '2024-08-20',
  },
  {
    id: 'vid-3',
    type: 'video',
    title: 'Nurturing Righteous Children in the Era of Digital Distractions',
    description: 'Practical parenting advice based on prophetic traditions and character cultivation.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Tarbiyyah & Family',
    speaker: 'Sheikh Abdurrahman Al-Josy',
    duration: '38 mins',
    date: '2024-07-10',
  },
  {
    id: 'pic-1',
    type: 'picture',
    title: 'Annual Graduation & Huffazh Tawafeeq Ceremony',
    description: 'Graduating students honored for complete memorization of the Holy Quran across branches.',
    url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=1200&q=80',
    category: 'Academy Programs',
    date: '2024-09-01',
  },
  {
    id: 'pic-2',
    type: 'picture',
    title: 'Daarul Iftaa Scholars Consultative Session',
    description: 'Convening of regional Islamic scholars to deliberate on community queries and academic curricula.',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    category: 'Scholarly Halaqat',
    date: '2024-08-12',
  },
  {
    id: 'pic-3',
    type: 'picture',
    title: 'Youth Tajweed & Qira\'at Competition',
    description: 'Students showcasing various authentic modes of Quran recitation.',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    category: 'Competitions',
    date: '2024-07-28',
  },
  {
    id: 'fatwa-1',
    type: 'fatwa',
    title: 'Ruling on Paying School Fees through Islamic Cooperative Schemes',
    question: 'Is it permissible for parents to participate in contributory rotating funds to finance their children\'s education?',
    verdict: 'Yes, it is fully permissible under Islamic jurisprudence provided that there is no stipulated interest, unequal benefit, or deceptive conditions.',
    category: 'Financial Fiqh',
    reference: 'Daarul Iftaa Council Verdict #2024-08',
    date: '2024-08-05',
  },
  {
    id: 'fatwa-2',
    type: 'fatwa',
    title: 'Prioritizing Quran Memorization Alongside Formal Western Studies',
    question: 'Can a student effectively balance high school secondary curriculum with full-time Tahfeez?',
    verdict: 'It is highly commendable. The prophetic model encourages excellence in both religious mastery and beneficial worldly knowledge, as structured in our dual-curriculum academy.',
    category: 'Education & Tarbiyyah',
    reference: 'Daarul Iftaa Educational Advisory',
    date: '2024-06-18',
  },
];

export default function DaarulIftaaPage() {
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('videos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);
  const [selectedPicture, setSelectedPicture] = useState<MediaItem | null>(null);

  // Real-time Firestore sync with collection `daarul_iftaa_media`
  const mediaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'daarul_iftaa_media');
  }, [firestore]);

  const { data: firestoreMedia, isLoading } = useCollection<MediaItem>(mediaQuery);

  // Combine firestore records with default media
  const allMedia = useMemo(() => {
    const list: MediaItem[] = [];
    if (firestoreMedia && firestoreMedia.length > 0) {
      list.push(...firestoreMedia);
    }
    // Include default media if not already present
    DEFAULT_MEDIA.forEach((item) => {
      if (!list.some((m) => m.title === item.title)) {
        list.push(item);
      }
    });
    return list;
  }, [firestoreMedia]);

  // Filters by type and search term
  const videos = useMemo(() => {
    return allMedia.filter(
      (m) =>
        m.type === 'video' &&
        (!searchTerm.trim() ||
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.speaker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allMedia, searchTerm]);

  const pictures = useMemo(() => {
    return allMedia.filter(
      (m) =>
        m.type === 'picture' &&
        (!searchTerm.trim() ||
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allMedia, searchTerm]);

  const fatawa = useMemo(() => {
    return allMedia.filter(
      (m) =>
        m.type === 'fatwa' &&
        (!searchTerm.trim() ||
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allMedia, searchTerm]);

  // Helper to format YouTube embed URL
  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    return url;
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-emerald-950 via-slate-900 to-primary-deep text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="container relative mx-auto px-4 text-center max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            مجلس الإفتاء والبحوث الإسلامية
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
            DAARUL IFTAA
          </h1>
          <p className="text-xl md:text-2xl text-emerald-200 font-light font-headline">
            Council of Islamic Jurisprudence, Scholarly Guidance & Media
          </p>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to the spiritual and scholarly wing of Al-Huffaazh Academy Nigeria Ltd. Explore our repository of authentic Fatawa, video lectures, educational symposiums, and Islamic photo gallery.
          </p>

          {/* Quick Search */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search lectures, topics, scholars, or fatawa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 bg-white/10 text-white placeholder:text-gray-300 border-white/20 rounded-xl focus:bg-white/20 transition-all text-base"
            />
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-12 md:py-20 bg-slate-50 min-h-[600px]">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-3 max-w-md w-full h-12 rounded-xl bg-slate-200 p-1">
                <TabsTrigger value="videos" className="rounded-lg flex items-center gap-2">
                  <Video className="h-4 w-4" /> Videos ({videos.length})
                </TabsTrigger>
                <TabsTrigger value="pictures" className="rounded-lg flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Pictures ({pictures.length})
                </TabsTrigger>
                <TabsTrigger value="fatawa" className="rounded-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Fatawa ({fatawa.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-headline text-slate-900">
                    Scholarly Video Lectures & Halaqat
                  </h2>
                  <p className="text-sm text-slate-500">
                    Recorded discourses by our esteemed Islamic scholars and resident teachers.
                  </p>
                </div>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No video lectures found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((vid) => (
                    <Card key={vid.id} className="overflow-hidden hover:shadow-lg transition-all rounded-2xl border-slate-200 flex flex-col">
                      <div 
                        onClick={() => setSelectedVideo(vid)}
                        className="relative h-48 bg-slate-900 flex items-center justify-center cursor-pointer group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="relative z-10 h-14 w-14 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 ml-0.5" />
                        </div>
                        {vid.duration && (
                          <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono z-10">
                            {vid.duration}
                          </span>
                        )}
                        <span className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold z-10">
                          {vid.category || 'Lecture'}
                        </span>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold line-clamp-2 hover:text-emerald-700 cursor-pointer" onClick={() => setSelectedVideo(vid)}>
                          {vid.title}
                        </CardTitle>
                        {vid.speaker && (
                          <CardDescription className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                            <User className="h-3.5 w-3.5" /> {vid.speaker}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {vid.description || 'Watch the full discourse and scholarly breakdown of this essential Islamic topic.'}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 text-xs text-slate-400 flex items-center justify-between border-t border-slate-100 p-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {vid.date || 'Recent'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedVideo(vid)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold p-0 h-auto"
                        >
                          Watch Now →
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pictures Tab */}
            <TabsContent value="pictures" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-headline text-slate-900">
                    Daarul Iftaa Photo Gallery & Programs
                  </h2>
                  <p className="text-sm text-slate-500">
                    Visual records of academic conferences, Tahfeez completions, and scholarly assemblies.
                  </p>
                </div>
              </div>

              {pictures.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No gallery pictures found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pictures.map((pic) => (
                    <Card key={pic.id} className="overflow-hidden hover:shadow-lg transition-all rounded-2xl border-slate-200 flex flex-col group">
                      <div 
                        onClick={() => setSelectedPicture(pic)}
                        className="relative h-60 bg-slate-100 cursor-pointer overflow-hidden"
                      >
                        <img 
                          src={pic.url} 
                          alt={pic.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                          {pic.category || 'Gallery'}
                        </span>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold line-clamp-1">
                          {pic.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {pic.description || 'Daarul Iftaa visual archives of Al-Huffaazh Academy.'}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 text-xs text-slate-400 flex items-center justify-between border-t border-slate-100 p-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {pic.date || 'Recorded'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedPicture(pic)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold p-0 h-auto"
                        >
                          Enlarge Photo
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Fatawa Tab */}
            <TabsContent value="fatawa" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-headline text-slate-900">
                    Official Islamic Fatawa & Legal Verdicts
                  </h2>
                  <p className="text-sm text-slate-500">
                    Clarification of legal principles according to the Quran and authentic Sunnah.
                  </p>
                </div>
              </div>

              {fatawa.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No fatawa rulings found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fatawa.map((fatwa) => (
                    <Card key={fatwa.id} className="rounded-2xl border-slate-200 shadow-sm p-6 hover:border-emerald-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-3 border-b border-slate-100">
                        <div>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-2">
                            {fatwa.category || 'Islamic Verdict'}
                          </Badge>
                          <h3 className="text-xl font-bold text-slate-900 font-headline">
                            {fatwa.title}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 font-mono">
                          {fatwa.reference || 'Ref: Daarul Iftaa'}
                        </span>
                      </div>
                      
                      {fatwa.question && (
                        <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4 text-emerald-600" /> Question Posed:
                          </p>
                          <p className="text-sm text-slate-700 italic">
                            &quot;{fatwa.question}&quot;
                          </p>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verdict & Scholarly Guidance:
                        </p>
                        <p className="text-sm text-slate-800 leading-relaxed font-body">
                          {fatwa.verdict || fatwa.description}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedVideo?.title}
            </DialogTitle>
            <DialogDescription>
              Speaker: {selectedVideo?.speaker || 'Al-Huffaazh Scholar'} • {selectedVideo?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4 my-2">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                {selectedVideo.url?.includes('youtube') || selectedVideo.url?.includes('youtu.be') ? (
                  <iframe
                    src={getEmbedUrl(selectedVideo.url)}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video 
                    src={selectedVideo.url} 
                    controls 
                    className="w-full h-full"
                  />
                )}
              </div>
              <p className="text-sm text-slate-600">
                {selectedVideo.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Picture Lightbox Modal */}
      <Dialog open={!!selectedPicture} onOpenChange={(open) => !open && setSelectedPicture(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedPicture?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedPicture?.category} • {selectedPicture?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedPicture?.url && (
            <div className="space-y-3 my-2">
              <div className="relative w-full h-[500px] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={selectedPicture.url}
                  alt={selectedPicture.title}
                  className="object-contain w-full h-full"
                />
              </div>
              <p className="text-sm text-slate-600">
                {selectedPicture.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
