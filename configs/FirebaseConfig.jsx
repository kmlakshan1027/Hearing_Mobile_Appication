// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGJFZX2bD413WEBwhiOZh1q1rVIle4yoA",
  authDomain: "hearing-care-dac29.firebaseapp.com",
  projectId: "hearing-care-dac29",
  storageBucket: "hearing-care-dac29.firebasestorage.app",
  messagingSenderId: "146927662261",
  appId: "1:146927662261:web:56a7b5fe2ab8a75ffcfafc",
  measurementId: "G-3VBV1JYYTJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);