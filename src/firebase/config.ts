// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3EmlDm4CdbmQOkIvcbi1Ki3PdrZBnGWU",
  authDomain: "collegemealprep.firebaseapp.com",
  projectId: "collegemealprep",
  storageBucket: "collegemealprep.firebasestorage.app",
  messagingSenderId: "564366100726",
  appId: "1:564366100726:web:2b08b7f16b1da0b7d884d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);