// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'professeur';
  createdAt: Date;
}

// Types pour les classes
export interface Classe {
  id: string;
  nom: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les élèves
export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classeId: string;
  email?: string;
  dateNaissance?: string;
  createdAt: Date;
}

// Types pour les entreprises
export interface Entreprise {
  id: string;
  nom: string;
  domaine: string;
  ville: string;
  tuteur: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les stages
export interface Stage {
  id: string;
  eleveId: string;
  entreprise: string;
  tuteurNom: string;
  tuteurEmail?: string;
  dateDebut: string;
  dateFin: string;
  sujet?: string;
  appreciation?: string;
  createdAt: Date;
}

// Types pour les évaluations
export interface Evaluation {
  id: string;
  stageId: string;
  eleveId: string;
  eleveNom: string;
  elevePrenom: string;
  classeNom: string;
  numeroStage: number;
  anneeScolaire: string;
  periodeId: string; // id de la période de stage (PFMP1, PFMP2...)
  
  // Critères d'évaluation (selon la fiche papier)
  critere1: 'A' | 'B' | 'C' | 'D';
  critere2: 'A' | 'B' | 'C' | 'D';
  critere3: 'A' | 'B' | 'C' | 'D';
  critere4: 'A' | 'B' | 'C' | 'D';
  critere5: 'A' | 'B' | 'C' | 'D';
  critere6: 'A' | 'B' | 'C' | 'D';
  critere7: 'A' | 'B' | 'C' | 'D';
  critere8: 'A' | 'B' | 'C' | 'D';
  critere9: 'A' | 'B' | 'C' | 'D';
  critere10: 'A' | 'B' | 'C' | 'D';
  critere11: 'A' | 'B' | 'C' | 'D';
  critere12: 'A' | 'B' | 'C' | 'D';
  critere13: 'A' | 'B' | 'C' | 'D';
  critere14: 'A' | 'B' | 'C' | 'D';
  critere15: 'A' | 'B' | 'C' | 'D';
  critere16: 'A' | 'B' | 'C' | 'D';
  critere17: 'A' | 'B' | 'C' | 'D';
  critere18: 'A' | 'B' | 'C' | 'D';
  critere19: 'A' | 'B' | 'C' | 'D';
  critere20: 'A' | 'B' | 'C' | 'D';
  critere21: 'A' | 'B' | 'C' | 'D';
  critere22: 'A' | 'B' | 'C' | 'D';
  critere23: 'A' | 'B' | 'C' | 'D';
  critere24: 'A' | 'B' | 'C' | 'D';
  critere25: 'A' | 'B' | 'C' | 'D';
  critere26: 'A' | 'B' | 'C' | 'D';
  critere27: 'A' | 'B' | 'C' | 'D';
  critere28: 'A' | 'B' | 'C' | 'D';
  critere29: 'A' | 'B' | 'C' | 'D';
  critere30: 'A' | 'B' | 'C' | 'D';
  critere31: 'A' | 'B' | 'C' | 'D';
  critere32: 'A' | 'B' | 'C' | 'D';
  critere33: 'A' | 'B' | 'C' | 'D';
  critere34: 'A' | 'B' | 'C' | 'D';
  critere35: 'A' | 'B' | 'C' | 'D';
  critere36: 'A' | 'B' | 'C' | 'D';
  critere37: 'A' | 'B' | 'C' | 'D';
  critere38: 'A' | 'B' | 'C' | 'D';
  critere39: 'A' | 'B' | 'C' | 'D';
  critere40: 'A' | 'B' | 'C' | 'D';
  
  commentaires: string;
  noteGlobale: number; // Calculée automatiquement
  
  createdBy: string; // ID de l'utilisateur qui a créé l'évaluation
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les statistiques
export interface Statistiques {
  totalEleves: number;
  totalStages: number;
  totalEvaluations: number;
  competencesAcquises: number;
  competencesEnCours: number;
  competencesNonAcquises: number;
  moyenneGlobale: number;
}

export interface PeriodeStage {
  id: string;
  nom: string; // ex: PFMP1
  dateDebut: string; // format ISO
  dateFin: string;
} 
