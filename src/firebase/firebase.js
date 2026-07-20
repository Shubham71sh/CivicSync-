// ─── Firebase SDK Initialization ─────────────────────────────────────────────
// CivicSync — Module 1 (AI Civic Twin, Schemes, GPS)
// Firestore is the primary data store for Module 1 features.
// The FastAPI backend (localhost:8000) handles Module 3 (Disaster Relief) separately.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMMKT-hq0Aczc4mDT4MMWD6bLgJB8hfAE",
  authDomain: "civic-sync-cosmic.firebaseapp.com",
  projectId: "civic-sync-cosmic",
  storageBucket: "civic-sync-cosmic.firebasestorage.app",
  messagingSenderId: "435195306753",
  appId: "1:435195306753:web:9d1a424f0decf7cdf27100",
  measurementId: "G-B731PQSDW2"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore — this is the MAIN export used by firestore.js
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Export app for other uses if needed
export default app;