// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// REPLACE THIS WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyAPdOcQlRUDBHdEXuwE0C4qU16lOoTjmik",
  authDomain: "localmiles-7c1d1.firebaseapp.com",
  projectId: "localmiles-7c1d1",
  storageBucket: "localmiles-7c1d1.firebasestorage.app",
  messagingSenderId: "616081486675",
  appId: "1:616081486675:web:d11504908bbcd31f49a7a6",
  measurementId: "G-NDRYNZDKT1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };