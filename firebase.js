import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB0hTBsZao7uoV_bcEf4r1Jm8hrSvfR9E",
  authDomain: "novexa-ai-63e9f.firebaseapp.com",
  projectId: "novexa-ai-63e9f",
  storageBucket: "novexa-ai-63e9f.firebasestorage.app",
  messagingSenderId: "963834669210",
  appId: "1:963834669210:web:7c5afebf17da3bce575723",
  measurementId: "G-NQV0305WGK"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
