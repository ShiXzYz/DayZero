import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
} else {
  adminApp = getApps()[0];
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
}

export { adminDb, adminAuth };
