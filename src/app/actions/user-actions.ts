
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/firebase/admin';

// Note: The deleteUser functionality was removed due to persistent server authentication issues.
// The function is left here as a placeholder for future implementation if the environment is configured.
/*
export async function deleteUser(payload: { uid: string }): Promise<{ success: boolean }> {
  try {
    const adminApp = await initializeAdminApp();
    const auth = getAuth(adminApp);
    const firestore = getFirestore(adminApp);
    
    // Delete from Firebase Authentication
    await auth.deleteUser(payload.uid);
    
    // Delete from Firestore 'users' collection
    await firestore.collection('users').doc(payload.uid).delete();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user.');
  }
}
*/
