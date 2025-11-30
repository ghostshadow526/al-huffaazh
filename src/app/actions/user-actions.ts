
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/firebase/admin';

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

export async function resetUserPassword(payload: { email: string }): Promise<{ success: boolean }> {
    try {
      const adminApp = await initializeAdminApp();
      const auth = getAuth(adminApp);
      
      await auth.generatePasswordResetLink(payload.email);

      return { success: true };
    } catch (error: any) {
        console.error('Error sending password reset:', error);
        throw new Error(error.message || 'Failed to send password reset email.');
    }
}
