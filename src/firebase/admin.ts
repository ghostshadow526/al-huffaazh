
import admin from 'firebase-admin';

// This function retrieves the service account credentials from a well-known
// environment variable automatically populated by Google Cloud services.
function getServiceAccount() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // In many Google Cloud environments, GOOGLE_APPLICATION_CREDENTIALS is set
    // with the path to the credentials file. If the content is directly in an
    // env var, we can use that.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    }
    // Fallback for environments where the variable holds the file path
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       // Since we are in a serverless environment, we might not be able to read files,
       // but we keep this for broader compatibility.
       const fs = require('fs');
       const path = require('path');
       const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
       if (fs.existsSync(filePath)) {
          return require(filePath);
       }
    }
    return undefined;
  } catch (e) {
    console.error('Failed to parse service account credentials:', e);
    return undefined;
  }
}


export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
     return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  // If no service account is found, initialize without it.
  // This will work in environments with Application Default Credentials.
  return admin.initializeApp();
}
