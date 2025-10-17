"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Logo } from './logo';

export type UserRole = 'super_admin' | 'branch_admin' | 'teacher' | 'parent';

export interface User extends FirebaseUser {
  role?: UserRole;
  branchId?: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() } as User);
        } else {
          // This logic is for the first time a super_admin signs in.
          // In a real app, you'd have a more secure way to assign the first admin.
          const isFirstUser = (await getDoc(doc(db, 'system', 'meta'))).data()?.userCount === undefined;
          if (isFirstUser) {
              const superAdminUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName || 'Super Admin',
                role: 'super_admin',
              };
              await setDoc(userDocRef, superAdminUser);
              await setDoc(doc(db, 'system', 'meta'), { userCount: 1 });
              setUser({ ...firebaseUser, ...superAdminUser });
          } else {
            setUser(firebaseUser); // A user with no role
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
