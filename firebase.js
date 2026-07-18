import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: window.NOVEXA_CONFIG?.apiKey || "YOUR_FIREBASE_API_KEY",
  authDomain: window.NOVEXA_CONFIG?.authDomain || "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: window.NOVEXA_CONFIG?.projectId || "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: window.NOVEXA_CONFIG?.storageBucket || "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: window.NOVEXA_CONFIG?.messagingSenderId || "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: window.NOVEXA_CONFIG?.appId || "YOUR_FIREBASE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
};
