import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyD52vyJqLpgloUMjf2LvV_F4PXUJovhAaQ",
  authDomain: "school-app-b3189.firebaseapp.com",
  projectId: "school-app-b3189",
  storageBucket: "school-app-b3189.firebasestorage.app",
  messagingSenderId: "714787780026",
  appId: "1:714787780026:web:309525c37a1c0ff16a9983",
  measurementId: "G-GQVE1XLV7F"
};

const app = initializeApp(firebaseConfig);

// This single export handles both Login and "Remember Me" persistence
// It replaces both the 'getAuth' and the 'initializeAuth' lines you had
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);