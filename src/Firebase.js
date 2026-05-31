import { initializeApp } from "firebase/app";
import {getFirestore} from '@firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDjpVNqFnCmDv3RYrOdhBZdew28fyML2T4",
  authDomain: "udhaar-88ada.firebaseapp.com",
  projectId: "udhaar-88ada",
  storageBucket: "udhaar-88ada.firebasestorage.app",
  messagingSenderId: "891841625517",
  appId: "1:891841625517:web:d7fe6cfb3c8aa97beeb524",
  measurementId: "G-X06MNN6NJX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)