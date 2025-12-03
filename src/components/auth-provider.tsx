
"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    const handleUser = async () => {
      if (firebaseUser && db) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() } as User);
        } else {
           const superAdminEmail = "alhuffazh@gmail.com";
           const adminToken = "4MPWGavMNqZLtdUGqtWvUYY0xDL2";

           if(firebaseUser.email === superAdminEmail && firebaseUser.uid === adminToken) {
              const superAdminUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName || 'Super Admin',
                role: 'super_admin' as const,
                status: 'active' as const,
              };
              await setDoc(userDocRef, superAdminUser);
              setUser({ ...firebaseUser, ...superAdminUser });
           } else {
             setUser(firebaseUser as User); 
           }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    if (!isUserLoading) {
        handleUser();
    }
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
