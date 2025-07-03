import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { User } from '../types';
import { Eleve } from '../types';

export class UserService {
  private collectionName = 'users';

  // Récupérer un utilisateur par ID
  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.collectionName, id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          id: userDoc.id,
          createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer tous les utilisateurs
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date(doc.data().createdAt),
      })) as User[];
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  // Créer un nouvel utilisateur (sans authentification)
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...userData,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  // Créer un nouvel utilisateur avec authentification Firebase
  async createUserWithAuth(userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: 'admin' | 'professeur';
  }): Promise<string> {
    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // 2. Créer le document utilisateur dans Firestore avec l'UID comme ID
      const userDoc = {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role,
        createdAt: new Date(),
      };

      // Utiliser setDoc avec l'UID Firebase comme ID du document
      await setDoc(doc(db, this.collectionName, firebaseUser.uid), userDoc);

      console.log('✅ Utilisateur créé avec succès:', firebaseUser.uid);
      return firebaseUser.uid;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'utilisateur avec auth:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...userData,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<void> {
    try {
      // Supprimer le document Firestore
      await deleteDoc(doc(db, this.collectionName, id));
      
      // Note: Pour supprimer l'utilisateur de Firebase Auth, il faudrait
      // une approche différente (Cloud Functions ou Admin SDK)
      console.log('✅ Utilisateur supprimé de Firestore:', id);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer les utilisateurs par rôle
  async getUsersByRole(role: 'admin' | 'professeur'): Promise<User[]> {
    try {
      const q = query(collection(db, this.collectionName), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date(doc.data().createdAt),
      })) as User[];
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs par rôle:', error);
      throw error;
    }
  }
}

export const userService = new UserService();

export const eleveService = {
  async getAllEleves(): Promise<Eleve[]> {
    const snapshot = await getDocs(collection(db, 'eleves'));
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nom: data.nom,
        prenom: data.prenom,
        classeId: data.classeId,
        email: data.email || '',
        dateNaissance: data.dateNaissance || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
  },
  async createEleve(eleve: Omit<Eleve, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'eleves'), {
      ...eleve,
      createdAt: new Date(),
    });
  },
  async updateEleve(id: string, eleve: Partial<Omit<Eleve, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, 'eleves', id), eleve);
  },
  async deleteEleve(id: string) {
    await deleteDoc(doc(db, 'eleves', id));
  },
}; 