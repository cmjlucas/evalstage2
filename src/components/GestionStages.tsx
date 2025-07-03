import React, { useEffect, useState } from 'react';
import { stageService } from '../services/stageService';
import { Stage, Eleve } from '../types';
import { eleveService } from '../services/userService';
import './GestionEleves.css';

const GestionStages: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [formData, setFormData] = useState({ eleveId: '', entreprise: '', tuteurNom: '', tuteurEmail: '', dateDebut: '', dateFin: '', sujet: '', appreciation: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStages();
    loadEleves();
  }, []);

  const loadStages = async () => {
    try {
      setLoading(true);
      const data = await stageService.getAllStages();
      setStages(data);
    } catch (err) {
      setError('Erreur lors du chargement des stages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEleves = async () => {
    try {
      const data = await eleveService.getAllEleves();
      setEleves(data);
    } catch (err) {
      setError('Erreur lors du chargement des élèves');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eleveId || !formData.entreprise.trim() || !formData.tuteurNom.trim() || !formData.dateDebut || !formData.dateFin) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }
    try {
      if (editingStage) {
        await stageService.updateStage(editingStage.id, formData);
      } else {
        await stageService.createStage(formData);
      }
      setFormData({ eleveId: '', entreprise: '', tuteurNom: '', tuteurEmail: '', dateDebut: '', dateFin: '', sujet: '', appreciation: '' });
      setEditingStage(null);
      setShowForm(false);
      setError(null);
      await loadStages();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
      console.error(err);
    }
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    setFormData({
      eleveId: stage.eleveId,
      entreprise: stage.entreprise,
      tuteurNom: stage.tuteurNom,
      tuteurEmail: stage.tuteurEmail || '',
      dateDebut: stage.dateDebut,
      dateFin: stage.dateFin,
      sujet: stage.sujet || '',
      appreciation: stage.appreciation || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stage ?')) {
      try {
        await stageService.deleteStage(id);
        await loadStages();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ eleveId: '', entreprise: '', tuteurNom: '', tuteurEmail: '', dateDebut: '', dateFin: '', sujet: '', appreciation: '' });
    setEditingStage(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) {
    return <div className="loading">Chargement des stages...</div>;
  }

  return (
    <div className="gestion-eleves">
      <div className="header">
        <h2>Gestion des Stages</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Ajouter un stage
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingStage ? 'Modifier le stage' : 'Nouveau stage'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="eleveId">Élève</label>
                <select id="eleveId" value={formData.eleveId} onChange={e => setFormData({ ...formData, eleveId: e.target.value })} required>
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(eleve => (
                    <option key={eleve.id} value={eleve.id}>{eleve.prenom} {eleve.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="entreprise">Entreprise</label>
                <input type="text" id="entreprise" value={formData.entreprise} onChange={e => setFormData({ ...formData, entreprise: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="tuteurNom">Tuteur</label>
                <input type="text" id="tuteurNom" value={formData.tuteurNom} onChange={e => setFormData({ ...formData, tuteurNom: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="tuteurEmail">Email du tuteur</label>
                <input type="email" id="tuteurEmail" value={formData.tuteurEmail} onChange={e => setFormData({ ...formData, tuteurEmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="dateDebut">Date de début</label>
                <input type="date" id="dateDebut" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="dateFin">Date de fin</label>
                <input type="date" id="dateFin" value={formData.dateFin} onChange={e => setFormData({ ...formData, dateFin: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="sujet">Sujet/Mission</label>
                <input type="text" id="sujet" value={formData.sujet} onChange={e => setFormData({ ...formData, sujet: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="appreciation">Appréciation</label>
                <input type="text" id="appreciation" value={formData.appreciation} onChange={e => setFormData({ ...formData, appreciation: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingStage ? 'Modifier' : 'Créer'}</button>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="eleves-grid">
        {stages.length === 0 ? (
          <div className="empty-state">
            <p>Aucun stage trouvé</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer le premier stage
            </button>
          </div>
        ) : (
          stages.map(stage => (
            <div key={stage.id} className="eleve-card">
              <div className="eleve-info">
                <h3>{(() => {
                  const eleve = eleves.find(e => e.id === stage.eleveId);
                  return eleve ? `${eleve.prenom} ${eleve.nom}` : 'Élève inconnu';
                })()}</h3>
                <p>Entreprise : {stage.entreprise}</p>
                <p>Tuteur : {stage.tuteurNom} {stage.tuteurEmail && `(${stage.tuteurEmail})`}</p>
                <p>Du {stage.dateDebut} au {stage.dateFin}</p>
                {stage.sujet && <p>Sujet : {stage.sujet}</p>}
                {stage.appreciation && <p>Appréciation : {stage.appreciation}</p>}
                <p>Créé le {(() => {
                  let date = stage.createdAt;
                  if (!(date instanceof Date)) date = new Date(date);
                  return isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString('fr-FR');
                })()}</p>
              </div>
              <div className="eleve-actions">
                <button className="btn-edit" onClick={() => handleEdit(stage)}>Modifier</button>
                <button className="btn-delete" onClick={() => handleDelete(stage.id)}>Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GestionStages; 
