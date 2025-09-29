import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDNpBEwRpJ4qHd-WuW8_4iA3vGgT2NEdjg",
  authDomain: "kolekkita.firebaseapp.com",
  projectId: "kolekkita",
  storageBucket: "kolekkita.firebasestorage.app",
  messagingSenderId: "606427939452",
  appId: "1:606427939452:web:25f650d0a2a86403367ff9",
  measurementId: "G-3EQML2DNQ5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
