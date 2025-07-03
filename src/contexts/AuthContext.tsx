import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Changement d\'état auth:', user?.uid || 'null');
      
      setFirebaseUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt) || new Date();
            
            const appUser: User = {
              id: user.uid,
              nom: userData.nom || '',
              prenom: userData.prenom || '',
              email: user.email || '',
              role: userData.role || 'professeur',
              createdAt
            };
            
            console.log('✅ Utilisateur chargé:', appUser.email, '- Rôle:', appUser.role);
            setCurrentUser(appUser);
          } else {
            console.log('📄 Création du profil utilisateur manquant...');
            const newUser: User = {
              id: user.uid,
              nom: '',
              prenom: '',
              email: user.email || '',
              role: 'professeur',
              createdAt: new Date()
            };
            
            await setDoc(doc(db, 'users', user.uid), {
              nom: newUser.nom,
              prenom: newUser.prenom,
              email: newUser.email,
              role: newUser.role,
              createdAt: newUser.createdAt
            });
            
            setCurrentUser(newUser);
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement utilisateur:', error);
          setCurrentUser(null);
        }
      } else {
        console.log('👤 Aucun utilisateur connecté');
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion...');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Connexion réussie');
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
