import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSLXXHXqajD03osfWh6tHpqVBy8KNFuk",
  authDomain: "leto-app-3fe2a.firebaseapp.com",
  databaseURL: "https://leto-app-3fe2a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "leto-app-3fe2a",
  storageBucket: "leto-app-3fe2a.firebasestorage.app",
  messagingSenderId: "1098020877963",
  appId: "1:1098020877963:web:3bfb2523c094bec352068e",
  measurementId: "G-Z0PMFVNKG8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

export { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
