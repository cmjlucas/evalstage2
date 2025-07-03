import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Classe } from '../types';
import { Timestamp } from 'firebase/firestore';

export class ClasseService {
  private collectionName = 'classes';

  // Récupérer une classe par ID
  async getClasseById(id: string): Promise<Classe | null> {
    try {
      const classeDoc = await getDoc(doc(db, this.collectionName, id));
      if (classeDoc.exists()) {
        const data = classeDoc.data();
        return {
          ...data,
          id: classeDoc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Classe;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la classe:', error);
      throw error;
    }
  }

  // Récupérer toutes les classes
  async getAllClasses(): Promise<Classe[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Classe;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      throw error;
    }
  }

  // Créer une nouvelle classe
  async createClasse(classeData: Omit<Classe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...classeData,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la classe:', error);
      throw error;
    }
  }

  // Mettre à jour une classe
  async updateClasse(id: string, classeData: Partial<Classe>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...classeData,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la classe:', error);
      throw error;
    }
  }

  // Supprimer une classe
  async deleteClasse(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la classe:', error);
      throw error;
    }
  }
}

export const classeService = new ClasseService(); 