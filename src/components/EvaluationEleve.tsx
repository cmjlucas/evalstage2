import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './EvaluationEleve.css';
import { getPeriodesStage } from '../services/periodeStageService';
import { PeriodeStage } from '../types';

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  classeId: string;
}

interface Classe {
  id: string;
  nom: string;
}

// Échelle d'évaluation
type NiveauEvaluation = 'non_evaluee' | 'non_acquise' | 'en_cours' | 'partiellement_acquise' | 'acquise';

interface CompetenceEvaluation {
  niveau: NiveauEvaluation;
  commentaire: string;
}

interface Evaluation {
  id?: string;
  eleveId: string;
  periodeId: string;
  dateEvaluation: Date;
      competences: {
      // CC1 - S'informer sur l'intervention ou la réalisation
      cc1_collecter_donnees: CompetenceEvaluation;
      
      // CC2 - Organiser la réalisation ou l'intervention  
      cc2_ordonner_donnees: CompetenceEvaluation;
      cc2_reperer_contraintes: CompetenceEvaluation;
      
      // CC3 - Analyser et exploiter les données
      cc3_identifier_elements: CompetenceEvaluation;
      cc3_identifier_grandeurs: CompetenceEvaluation;
      cc3_representer_installation: CompetenceEvaluation;
      
      // CC4 - Réaliser une installation ou une intervention
      cc4_implanter_cabler: CompetenceEvaluation;
      cc4_realiser_installation: CompetenceEvaluation;
      cc4_operer_attitude: CompetenceEvaluation;
      
      // CC7 - Établir un pré-diagnostic à distance
      cc7_controler_donnees: CompetenceEvaluation;
      cc7_constater_defaillance: CompetenceEvaluation;
      cc7_lister_hypotheses: CompetenceEvaluation;
      
      // CC8 - Renseigner les documents
      cc8_completer_documents: CompetenceEvaluation;
      cc8_expliquer_avancement: CompetenceEvaluation;
      cc8_rediger_compte_rendu: CompetenceEvaluation;
      
      // CC9 - Communiquer avec le client et/ou l'usager
      cc9_interpreter_informations: CompetenceEvaluation;
      cc9_expliquer_fonctionnement: CompetenceEvaluation;
      cc9_informer_consignes: CompetenceEvaluation;
    };
  commentaireGeneral: string;
  recommandations: string;
  noteGlobale?: string;
}

const EvaluationEleve: React.FC = () => {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeStage[]>([]);
  const [selectedEleve, setSelectedEleve] = useState<string>('');
  const [selectedEleveData, setSelectedEleveData] = useState<Eleve | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'selection' | 'evaluation'>('selection');
  
  const [evaluation, setEvaluation] = useState<Evaluation>({
    eleveId: '',
    periodeId: '',
    dateEvaluation: new Date(),
    competences: {
      cc1_collecter_donnees: { niveau: 'non_evaluee', commentaire: '' },
      cc2_ordonner_donnees: { niveau: 'non_evaluee', commentaire: '' },
      cc2_reperer_contraintes: { niveau: 'non_evaluee', commentaire: '' },
      cc3_identifier_elements: { niveau: 'non_evaluee', commentaire: '' },
      cc3_identifier_grandeurs: { niveau: 'non_evaluee', commentaire: '' },
      cc3_representer_installation: { niveau: 'non_evaluee', commentaire: '' },
      cc4_implanter_cabler: { niveau: 'non_evaluee', commentaire: '' },
      cc4_realiser_installation: { niveau: 'non_evaluee', commentaire: '' },
      cc4_operer_attitude: { niveau: 'non_evaluee', commentaire: '' },
      cc7_controler_donnees: { niveau: 'non_evaluee', commentaire: '' },
      cc7_constater_defaillance: { niveau: 'non_evaluee', commentaire: '' },
      cc7_lister_hypotheses: { niveau: 'non_evaluee', commentaire: '' },
      cc8_completer_documents: { niveau: 'non_evaluee', commentaire: '' },
      cc8_expliquer_avancement: { niveau: 'non_evaluee', commentaire: '' },
      cc8_rediger_compte_rendu: { niveau: 'non_evaluee', commentaire: '' },
      cc9_interpreter_informations: { niveau: 'non_evaluee', commentaire: '' },
      cc9_expliquer_fonctionnement: { niveau: 'non_evaluee', commentaire: '' },
      cc9_informer_consignes: { niveau: 'non_evaluee', commentaire: '' },
    },
    commentaireGeneral: '',
    recommandations: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('=== DÉBUT CHARGEMENT DES DONNÉES ===');
      
      // Charger les élèves
      const elevesSnapshot = await getDocs(collection(db, 'eleves'));
      const elevesData = elevesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Eleve[];
      setEleves(elevesData);
      console.log('Élèves chargés:', elevesData.length, elevesData);

      // Charger les classes
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Classe[];
      setClasses(classesData);
      console.log('Classes chargées:', classesData.length, classesData);

      // Charger les périodes
      console.log('Début chargement des périodes...');
      const periodesData = await getPeriodesStage();
      console.log('Périodes récupérées du service:', periodesData);
      setPeriodes(periodesData);
      console.log('Périodes définies dans le state:', periodesData.length);
      
      console.log('=== FIN CHARGEMENT DES DONNÉES ===');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestPeriode = async () => {
    try {
      const testPeriode = {
        nom: 'PFMP1 - Test',
        dateDebut: '2024-01-15',
        dateFin: '2024-02-15'
      };
      
      await addDoc(collection(db, 'periodesStage'), testPeriode);
      console.log('Période de test créée');
      
      // Recharger les données
      await loadData();
      alert('Période de test créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la période de test:', error);
      alert('Erreur lors de la création de la période de test');
    }
  };

  const loadEvaluationExistante = async (eleveId: string, periodeId: string) => {
    try {
      const evaluationsQuery = query(
        collection(db, 'evaluations'),
        where('eleveId', '==', eleveId),
        where('periodeId', '==', periodeId)
      );
      
      const evaluationsSnapshot = await getDocs(evaluationsQuery);
      
      if (!evaluationsSnapshot.empty) {
        const existingEvaluation = evaluationsSnapshot.docs[0].data() as Evaluation;
        
        setEvaluation({
          ...existingEvaluation,
          id: evaluationsSnapshot.docs[0].id,
          dateEvaluation: existingEvaluation.dateEvaluation instanceof Date 
            ? existingEvaluation.dateEvaluation 
            : new Date(existingEvaluation.dateEvaluation)
        });
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'évaluation existante:', error);
      return false;
    }
  };

  const handlePeriodeSelect = async (periodeId: string) => {
    // Utiliser selectedEleve directement au lieu de evaluation.eleveId
    if (selectedEleve) {
      const evaluationChargee = await loadEvaluationExistante(selectedEleve, periodeId);
      
      if (!evaluationChargee) {
        // Initialiser une nouvelle évaluation avec la période sélectionnée
        const nouvelleEvaluation = {
          ...evaluation,
          eleveId: selectedEleve,
          periodeId,
          competences: {
            cc1_collecter_donnees: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc2_ordonner_donnees: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc2_reperer_contraintes: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc3_identifier_elements: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc3_identifier_grandeurs: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc3_representer_installation: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc4_implanter_cabler: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc4_realiser_installation: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc4_operer_attitude: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc7_controler_donnees: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc7_constater_defaillance: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc7_lister_hypotheses: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc8_completer_documents: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc8_expliquer_avancement: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc8_rediger_compte_rendu: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc9_interpreter_informations: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc9_expliquer_fonctionnement: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
            cc9_informer_consignes: { niveau: 'non_evaluee' as NiveauEvaluation, commentaire: '' },
          },
          commentaireGeneral: '',
          recommandations: ''
        };
        
        setEvaluation(nouvelleEvaluation);
      }
    } else {
      // Si pas d'élève sélectionné, juste mettre à jour la période
      setEvaluation(prev => ({ ...prev, periodeId }));
    }
  };

  const handleEleveSelect = (eleveId: string) => {
    const eleve = eleves.find(e => e.id === eleveId);
    const classe = classes.find(c => c.id === eleve?.classeId);
    
    setSelectedEleve(eleveId);
    setSelectedEleveData(eleve || null);
    setSelectedClasse(classe || null);
    setEvaluation(prev => ({ ...prev, eleveId }));
    setCurrentStep('evaluation');
  };

  const handleCompetenceChange = (competenceKey: keyof Evaluation['competences'], field: 'niveau' | 'commentaire', value: string) => {
    setEvaluation(prev => ({
      ...prev,
      competences: {
        ...prev.competences,
        [competenceKey]: {
          ...prev.competences[competenceKey],
          [field]: value
        }
      }
    }));
  };

  const getNiveauLabel = (niveau: NiveauEvaluation): string => {
    const labels = {
      'non_evaluee': 'Non évaluée',
      'non_acquise': 'Non acquise',
      'en_cours': 'En cours d\'acquisition',
      'partiellement_acquise': 'Partiellement acquise',
      'acquise': 'Acquise'
    };
    return labels[niveau];
  };

  const getNiveauColor = (niveau: NiveauEvaluation): string => {
    const colors = {
      'non_evaluee': '#gray',
      'non_acquise': '#ff4444',
      'en_cours': '#ff8800',
      'partiellement_acquise': '#ffaa00',
      'acquise': '#00aa44'
    };
    return colors[niveau];
  };

  const formatDateFromString = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  const renderCompetenceSelect = (competenceKey: keyof Evaluation['competences'], niveau: NiveauEvaluation) => {
    return (
      <select
        value={niveau}
        onChange={(e) => handleCompetenceChange(competenceKey, 'niveau', e.target.value)}
        className="niveau-select"
        style={{ borderColor: getNiveauColor(niveau as NiveauEvaluation) }}
      >
        <option value="non_evaluee">⬜ Non évaluée</option>
        <option value="non_acquise">🟥 Non acquise</option>
        <option value="en_cours">🟧 En cours d'acquisition</option>
        <option value="partiellement_acquise">🟨 Partiellement acquise</option>
        <option value="acquise">🟩 Acquise</option>
      </select>
    );
  };

  const renderCompetenceTile = (competenceKey: keyof Evaluation['competences'], title: string) => {
    const competence = evaluation.competences[competenceKey];
    
    return (
      <div className="competence-tile" key={competenceKey}>
        <div className="competence-header">
          <h4 className="competence-title">{title}</h4>
          {renderCompetenceSelect(competenceKey, competence.niveau)}
        </div>
        <div className="competence-content">
          <textarea
            value={competence.commentaire}
            onChange={(e) => handleCompetenceChange(competenceKey, 'commentaire', e.target.value)}
            placeholder="Commentaire optionnel..."
            rows={2}
            className="competence-textarea"
          />
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evaluation.eleveId || !evaluation.periodeId) {
      alert('Veuillez sélectionner un élève et une période');
      return;
    }

    try {
      const evaluationData = {
        ...evaluation,
        dateEvaluation: new Date()
      };

      if (evaluation.id) {
        // Mise à jour d'une évaluation existante
        console.log('Mise à jour de l\'évaluation existante:', evaluation.id);
        await updateDoc(doc(db, 'evaluations', evaluation.id), evaluationData);
        alert('Évaluation mise à jour avec succès !');
      } else {
        // Création d'une nouvelle évaluation
        console.log('Création d\'une nouvelle évaluation');
        const docRef = await addDoc(collection(db, 'evaluations'), evaluationData);
        console.log('Nouvelle évaluation créée avec l\'ID:', docRef.id);
        
        // Mettre à jour l'état avec l'ID de la nouvelle évaluation
        setEvaluation(prev => ({ ...prev, id: docRef.id }));
        alert('Évaluation enregistrée avec succès !');
      }
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'évaluation');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  // Étape de sélection
  if (currentStep === 'selection') {
    return (
      <div className="evaluation-eleve">
        <div className="header">
          <h1>Évaluation des Élèves</h1>
          <p>Sélectionnez un élève pour commencer l'évaluation</p>
        </div>

        <div className="eleves-grid">
          {eleves.length === 0 ? (
            <div className="no-data">
              <p>Aucun élève trouvé.</p>
              <p>Veuillez d'abord aller dans "Gestion des Classes" pour ajouter des élèves.</p>
            </div>
          ) : (
            eleves.map(eleve => {
              const classe = classes.find(c => c.id === eleve.classeId);
              return (
                <div key={eleve.id} className="eleve-tile">
                  <div className="eleve-info" onClick={() => handleEleveSelect(eleve.id)}>
                    <h3>{eleve.prenom} {eleve.nom}</h3>
                    <p className="classe">Classe: {classe?.nom || 'Non assignée'}</p>
                    <p className="naissance">Né(e) le: {eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseigné'}</p>
                  </div>
                  <div className="eleve-actions">
                    <button 
                      className="btn-evaluer"
                      onClick={() => handleEleveSelect(eleve.id)}
                    >
                      Évaluer →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Étape d'évaluation
  return (
    <div className="evaluation-eleve">
      <div className="header">
        <button 
          className="btn-retour" 
          onClick={() => setCurrentStep('selection')}
        >
          ← Retour à la sélection
        </button>
        <div className="eleve-selected">
          <h1>Évaluation de {selectedEleveData?.prenom} {selectedEleveData?.nom}</h1>
          <p className="classe-info">Classe: {selectedClasse?.nom}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="evaluation-form">
        {/* Sélection de la période */}
        <div className="periode-selection-tile">
          <h2>Période de stage</h2>
          {periodes.length === 0 ? (
            <div className="no-periode">
              <p>Aucune période de stage trouvée.</p>
              <p>Veuillez d'abord aller dans "Gestion des Périodes de Stage" pour ajouter des périodes.</p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={createTestPeriode}
                style={{ marginTop: '1rem' }}
              >
                Créer une période de test
              </button>
            </div>
          ) : (
            <div className="periodes-grid">
              {periodes.map(periode => (
                <div 
                  key={periode.id} 
                  className={`periode-tile ${evaluation.periodeId === periode.id ? 'selected' : ''}`}
                  onClick={() => handlePeriodeSelect(periode.id)}
                >
                  <h3>{periode.nom}</h3>
                  <p>{formatDateFromString(periode.dateDebut)} - {formatDateFromString(periode.dateFin)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {evaluation.periodeId && (
          <>
            {/* CC1 - S'informer sur l'intervention ou la réalisation */}
            <div className="competence-section">
              <h2>CC1 - S'informer sur l'intervention ou la réalisation</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc1_collecter_donnees', 'Collecter les données nécessaires à l\'intervention ou à la réalisation en utilisant les outils numériques')}
              </div>
            </div>

            {/* CC2 - Organiser la réalisation ou l'intervention */}
            <div className="competence-section">
              <h2>CC2 - Organiser la réalisation ou l'intervention</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc2_ordonner_donnees', 'Ordonner les données nécessaires à l\'intervention ou à la réalisation en tenant compte des interactions avec les autres intervenants')}
                {renderCompetenceTile('cc2_reperer_contraintes', 'Repérer les contraintes liées à l\'efficacité énergétique')}
              </div>
            </div>

            {/* CC3 - Analyser et exploiter les données */}
            <div className="competence-section">
              <h2>CC3 - Analyser et exploiter les données</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc3_identifier_elements', 'Identifier les éléments d\'un système énergétique, de son installation électrique et de son environnement numérique')}
                {renderCompetenceTile('cc3_identifier_grandeurs', 'Identifier les grandeurs physiques nominales associées à l\'installation (températures, pressions, puissances, intensités, tensions, ...)')}
                {renderCompetenceTile('cc3_representer_installation', 'Représenter tout ou partie d\'une installation, manuellement ou avec un outil numérique')}
              </div>
            </div>

            {/* CC4 - Réaliser une installation ou une intervention */}
            <div className="competence-section">
              <h2>CC4 - Réaliser une installation ou une intervention</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc4_implanter_cabler', 'Implanter, câbler, raccorder les matériels, les supports, les appareillages et les équipements d\'interconnexion')}
                {renderCompetenceTile('cc4_realiser_installation', 'Réaliser l\'installation et/ou les modifications des réseaux fluidiques et/ou les câblages électriques')}
                {renderCompetenceTile('cc4_operer_attitude', 'Opérer avec une attitude écoresponsable')}
              </div>
            </div>

            {/* CC7 - Établir un pré-diagnostic à distance */}
            <div className="competence-section">
              <h2>CC7 - Établir un pré-diagnostic à distance</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc7_controler_donnees', 'Contrôler les données d\'exploitation (indicateurs, voyants, ...) par rapport aux attendus')}
                {renderCompetenceTile('cc7_constater_defaillance', 'Constater la défaillance')}
                {renderCompetenceTile('cc7_lister_hypotheses', 'Lister des hypothèses de panne(s) et/ou de dysfonctionnement(s)')}
              </div>
            </div>

            {/* CC8 - Renseigner les documents */}
            <div className="competence-section">
              <h2>CC8 - Renseigner les documents</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc8_completer_documents', 'Compléter les documents techniques et administratifs')}
                {renderCompetenceTile('cc8_expliquer_avancement', 'Expliquer l\'état d\'avancement des opérations, leurs contraintes et leurs difficultés')}
                {renderCompetenceTile('cc8_rediger_compte_rendu', 'Rédiger un compte-rendu, un rapport d\'activité')}
              </div>
            </div>

            {/* CC9 - Communiquer avec le client et/ou l'usager */}
            <div className="competence-section">
              <h2>CC9 - Communiquer avec le client et/ou l'usager</h2>
              <div className="competences-grid">
                {renderCompetenceTile('cc9_interpreter_informations', 'Interpréter les informations du client et/ou l\'exploitant sur ses besoins')}
                {renderCompetenceTile('cc9_expliquer_fonctionnement', 'Expliquer le fonctionnement et l\'utilisation de l\'installation au client et/ou à l\'exploitant')}
                {renderCompetenceTile('cc9_informer_consignes', 'Informer oralement des consignes de sécurité')}
              </div>
            </div>

             {/* Commentaires et actions */}
            <div className="commentaires-section">
              <div className="commentaire-tile">
                <h3>Commentaire général</h3>
                <textarea
                  value={evaluation.commentaireGeneral}
                  onChange={(e) => setEvaluation({...evaluation, commentaireGeneral: e.target.value})}
                  rows={4}
                  placeholder="Commentaire général sur l'évaluation..."
                />
              </div>

              <div className="commentaire-tile">
                <h3>Recommandations</h3>
                <textarea
                  value={evaluation.recommandations}
                  onChange={(e) => setEvaluation({...evaluation, recommandations: e.target.value})}
                  rows={4}
                  placeholder="Recommandations pour l'élève..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {evaluation.id ? '🔄 Mettre à jour l\'évaluation' : '💾 Enregistrer l\'évaluation'}
              </button>
              {evaluation.id && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                  ℹ️ Une évaluation existe déjà pour cette période - elle sera mise à jour
                </p>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default EvaluationEleve; 