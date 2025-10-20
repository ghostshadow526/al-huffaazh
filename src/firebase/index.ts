
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: This is the core Firebase initialization logic.
// It ensures that Firebase is initialized only once.
export function initializeFirebase() {
  let app: FirebaseApp;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    firebaseApp: app,
    auth,
    firestore,
  };
}

export * from './provider';
export * from './client-provider';

export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
