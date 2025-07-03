import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase (à remplacer par tes vraies clés plus tard)
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAADvft0ne-CpB00qBPOkJMcFqCGe-tOaU",
  authDomain: "evalstage2-lucas2025.firebaseapp.com",
  projectId: "evalstage2-lucas2025",
  storageBucket: "evalstage2-lucas2025.appspot.com",
  messagingSenderId: "1074657513257",
  appId: "1:1074657513257:web:f3fcc8ec7a421801277138"
};


// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 