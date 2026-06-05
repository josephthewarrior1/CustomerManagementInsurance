// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBg72_imTZRZ9RaZs9_9X3eRdDLVrHmuag",
  authDomain: "pt-kuda-jaya-abadi.firebaseapp.com",
  databaseURL: "https://pt-kuda-jaya-abadi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pt-kuda-jaya-abadi",
  storageBucket: "pt-kuda-jaya-abadi.firebasestorage.app",
  messagingSenderId: "546945993573",
  appId: "1:546945993573:web:9f63bc454edfda7b73ef8c",
  measurementId: "G-KVZ09E40P7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Changed from getDatabase(app)
const auth = getAuth(app);

export { app, db, auth };