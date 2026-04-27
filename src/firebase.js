import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGBRh80gnDBtdNbwfQi0pkdB5Va7poRAs",
  authDomain: "collaborative-study-planner.firebaseapp.com",
  projectId: "collaborative-study-planner",
  storageBucket: "collaborative-study-planner.firebasestorage.app",
  messagingSenderId: "300608379830",
  appId: "1:300608379830:web:013251142d36db03933f17"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);