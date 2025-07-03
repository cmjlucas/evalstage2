import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const createTestUser = async () => {
  try {
    // Créer l'utilisateur Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'test@example.com',
      'password123'
    );

    // Créer le document Firestore
    const userData = {
      id: userCredential.user.uid,
      email: 'test@example.com',
      nom: 'Test',
      prenom: 'Utilisateur',
      role: 'professeur',
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    console.log('✅ Utilisateur de test créé:', userData);
    return userData;
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    throw error;
  }
};

// Exécuter si appelé directement
if (typeof window !== 'undefined') {
  (window as any).createTestUser = createTestUser;
} 
