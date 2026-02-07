import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7GTDzLO4JfMSw3Sw1XQcpJsGFWpkSUuk",
  authDomain: "dra-lueine-barradas.firebaseapp.com",
  projectId: "dra-lueine-barradas",
  storageBucket: "dra-lueine-barradas.firebasestorage.app",
  messagingSenderId: "1010406146962",
  appId: "1:1010406146962:web:ffded9bc70de18b5f8b74b",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
