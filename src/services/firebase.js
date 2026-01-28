import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDi8vIOxGVabZgG6xkCo6WCwgg5KHEPY74",
  authDomain: "papo-de-quadrilha.firebaseapp.com",
  projectId: "papo-de-quadrilha",
  storageBucket: "papo-de-quadrilha.firebasestorage.app",
  messagingSenderId: "369004277262",
  appId: "1:369004277262:web:e2c28cb5eeebdb226c165f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
