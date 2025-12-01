
import admin from 'firebase-admin';

export async function initializeAdminApp() {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Initialize the app. In a managed Google Cloud environment (like App Hosting),
  // Firebase Admin SDK automatically discovers the service account credentials
  // via Application Default Credentials (ADC) without any explicit configuration.
  return admin.initializeApp();
}
