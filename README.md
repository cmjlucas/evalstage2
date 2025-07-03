# Application PFMP - Gestion des Évaluations de Stage

Une application web moderne pour la gestion des évaluations de Périodes de Formation en Milieu Professionnel (PFMP) dans le cadre du cursus MTNF.

## 🚀 Fonctionnalités

### Pour les Administrateurs
- **Gestion des classes** : Créer, modifier et supprimer les classes
- **Gestion des périodes de stage** : Définir les périodes PFMP1, PFMP2, etc.
- **Gestion des utilisateurs** : Créer et gérer les comptes professeurs
- **Accès complet** : Toutes les fonctionnalités disponibles

### Pour les Professeurs
- **Évaluation des élèves** : Remplir les fiches d'évaluation par compétences
- **Export des rapports** : Télécharger les rapports en PDF ou Excel
- **Suivi des élèves** : Visualiser les évaluations et les progrès

## 🛠️ Technologies Utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : CSS moderne avec thème sombre
- **Backend** : Firebase (Firestore + Authentication)
- **Build** : Vite
- **Déploiement** : GitHub Pages
- **Exports** : jsPDF, xlsx

## 📋 Compétences Évaluées

L'application permet d'évaluer les compétences du référentiel MTNF :

- **CC1** : Collecter des données
- **CC2** : Ordonner les données / Repérer les contraintes
- **CC3** : Traiter les données / Proposer des solutions
- **CC4** : Mettre en forme / Présenter les résultats
- **CC5** : Communiquer / Argumenter

Chaque compétence est évaluée selon 4 niveaux :
- 🟢 **Acquis** : Compétence maîtrisée
- 🟡 **En cours** : En voie d'acquisition
- 🔴 **Non acquis** : Nécessite du travail
- ⚪ **Non évalué** : Pas encore évalué

## 🚀 Installation et Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Firebase

### Installation locale
```bash
# Cloner le repository
git clone https://github.com/votre-username/evalstage2.git
cd evalstage2

# Installer les dépendances
npm install

# Configurer Firebase (créer src/firebase.ts avec vos clés)

# Lancer en développement
npm run dev
```

### Déploiement sur GitHub Pages
```bash
# Build et déploiement automatique
npm run deploy
```

## 🔧 Configuration Firebase

Créer un fichier `src/firebase.ts` avec votre configuration :

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Votre configuration Firebase
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 👥 Utilisation

### Premier démarrage
1. Créer un compte administrateur
2. Ajouter des classes et des périodes de stage
3. Créer des comptes professeurs
4. Les professeurs peuvent commencer à évaluer les élèves

### Évaluation d'un élève
1. Sélectionner un élève
2. Choisir la période de stage
3. Évaluer chaque compétence
4. Ajouter des commentaires
5. Sauvegarder l'évaluation

### Export des rapports
1. Sélectionner les critères (classe, période, format)
2. Télécharger le rapport PDF ou Excel
3. Les rapports incluent les évaluations et les statistiques

## 🎨 Interface

- **Thème sombre permanent** pour un confort visuel
- **Interface responsive** adaptée à tous les écrans
- **Navigation intuitive** avec menu burger
- **Feedback visuel** pour toutes les actions

## 📊 Exports

### PDF
- Rapport individuel par élève
- Synthèse par classe
- Graphiques de progression

### Excel
- Données brutes pour analyses
- Tableaux croisés dynamiques
- Statistiques par compétence

## 🔒 Sécurité

- Authentification Firebase
- Contrôle d'accès par rôle (admin/professeur)
- Protection des routes sensibles
- Validation des données côté client et serveur

## 📱 Compatibilité

- Chrome, Firefox, Safari, Edge
- Responsive design (mobile, tablette, desktop)
- PWA ready (installation possible)

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

Développé avec ❤️ pour faciliter l'évaluation des stages PFMP 