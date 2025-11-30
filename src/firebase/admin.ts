
import admin from 'firebase-admin';

export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable for admin initialization.');
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
