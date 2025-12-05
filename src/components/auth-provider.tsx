
"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { Logo } from './logo';
import { useUser, useFirestore } from '@/firebase';

export type UserRole = 'super_admin' | 'branch_admin' | 'teacher' | 'parent';

export interface User extends FirebaseUser {
  role?: UserRole;
  branchId?: string;
  fullName?: string;
  status?: 'active' | 'disabled';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: firebaseUser, isUserLoading } = useUser();
  const db = useFirestore();

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const handleUser = async () => {
      if (firebaseUser && db) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Set up a real-time listener
        unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            setUser({ ...firebaseUser, ...userDoc.data() } as User);
          } else {
            // This logic handles the initial creation of the super_admin document
            const superAdminEmail = "alhuffazh@gmail.com";
            const adminToken = "4MPWGavMNqZLtdUGqtWvUYY0xDL2";

            if (firebaseUser.email === superAdminEmail && firebaseUser.uid === adminToken) {
              const superAdminUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName || 'Super Admin',
                role: 'super_admin' as const,
                status: 'active' as const,
              };
              try {
                await setDoc(userDocRef, superAdminUser);
                // The listener will pick up this change and set the user state
              } catch (e) {
                console.error("Failed to create super_admin user document:", e);
                setUser(firebaseUser as User); // Fallback
              }
            } else {
              // User is authenticated but has no Firestore document
              setUser(firebaseUser as User);
            }
          }
          setLoading(false);
        }, (error) => {
           console.error("Error listening to user document:", error);
           setUser(firebaseUser as User); // Fallback to auth user on listener error
           setLoading(false);
        });

      } else {
        // No authenticated user
        setUser(null);
        setLoading(false);
      }
    };

    if (!isUserLoading) {
      handleUser();
    }

    // Cleanup: unsubscribe from the listener when the component unmounts or user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseUser, isUserLoading, db]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Logo className="h-16 w-16 animate-pulse text-accent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
