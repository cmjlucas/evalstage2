import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { PeriodeStage } from '../types';

const collectionName = 'periodesStage';

export const getPeriodesStage = async (): Promise<PeriodeStage[]> => {
  try {
    console.log('Service: Récupération des périodes de stage...');
    const snapshot = await getDocs(collection(db, collectionName));
    console.log('Service: Nombre de documents trouvés:', snapshot.docs.length);
    const result = snapshot.docs.map(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() } as PeriodeStage;
      console.log('Service: Période trouvée:', data);
      return data;
    });
    console.log('Service: Périodes retournées:', result);
    return result;
  } catch (error) {
    console.error('Service: Erreur lors de la récupération des périodes:', error);
    throw error;
  }
};

export const addPeriodeStage = async (periode: Omit<PeriodeStage, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), periode);
  return docRef.id;
};

export const updatePeriodeStage = async (id: string, data: Partial<PeriodeStage>) => {
  await updateDoc(doc(db, collectionName, id), data);
};

export const deletePeriodeStage = async (id: string) => {
  await deleteDoc(doc(db, collectionName, id));
}; 