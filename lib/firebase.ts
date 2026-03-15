import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAYk57ihSIU-JFE_oO3gELZW96jt0KM-3c",
  authDomain: "novafunded-7f78f.firebaseapp.com",
  projectId: "novafunded-7f78f",
  storageBucket: "novafunded-7f78f.firebasestorage.app",
  messagingSenderId: "886292181594",
  appId: "1:886292181594:web:7a52a557c0637e5f1b1e63",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app