

'use client';

import React from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BellRing, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user?.uid, firestore]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const handleMarkAllAsRead = async () => {
    if (!firestore || !notifications || notifications.length === 0) return;
    
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifs.forEach(notif => {
      const notifRef = doc(firestore, 'notifications', notif.id);
      batch.update(notifRef, { read: true });
    });

    try {
      await batch.commit();
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not mark notifications as read.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Recent updates and payment alerts.</p>
        </div>
        <Button onClick={handleMarkAllAsRead} disabled={isLoading || !notifications?.some(n => !n.read)}>
          <Check className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Here are your recent notifications from the academy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                    notif.read ? 'bg-secondary/50 text-muted-foreground' : 'bg-background'
                  )}
                >
                  <div className={cn("mt-1 h-2 w-2 rounded-full", !notif.read && "bg-accent")}></div>
                  <div className="flex-1 space-y-1">
                     <Link href={notif.link} className="font-semibold hover:underline">{notif.message}</Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.createdAt.seconds * 1000), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-48 rounded-lg border border-dashed">
                <BellRing className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No New Notifications</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your inbox is all clear. We'll let you know when something new comes up.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
