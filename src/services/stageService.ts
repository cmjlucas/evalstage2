import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Stage } from '../types';

export const stageService = {
  async getAllStages(): Promise<Stage[]> {
    const snapshot = await getDocs(collection(db, 'stages'));
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        eleveId: data.eleveId,
        entreprise: data.entreprise,
        tuteurNom: data.tuteurNom,
        tuteurEmail: data.tuteurEmail || '',
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        sujet: data.sujet || '',
        appreciation: data.appreciation || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
  },
  async createStage(stage: Omit<Stage, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'stages'), {
      ...stage,
      createdAt: new Date(),
    });
  },
  async updateStage(id: string, stage: Partial<Omit<Stage, 'id' | 'createdAt'>>) {
    await updateDoc(doc(db, 'stages', id), stage);
  },
  async deleteStage(id: string) {
    await deleteDoc(doc(db, 'stages', id));
  },
}; 