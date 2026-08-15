import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración oficial de Firebase para OnFire
const firebaseConfig = {
  apiKey: "AIzaSyDVdg25IfWHQV324to3ALTpZJbNCnB9LJQ",
  authDomain: "onfire-6e156.firebaseapp.com",
  projectId: "onfire-6e156",
  storageBucket: "onfire-6e156.firebasestorage.app",
  messagingSenderId: "957338017834",
  appId: "1:957338017834:web:e7872b0a1eff8c22dc6353"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);
