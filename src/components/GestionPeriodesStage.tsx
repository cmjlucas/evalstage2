import React, { useEffect, useState } from 'react';
import { PeriodeStage } from '../types';
import { getPeriodesStage, addPeriodeStage, updatePeriodeStage, deletePeriodeStage } from '../services/periodeStageService';
import './GestionPeriodesStage.css';

// Fonction pour convertir une date ISO en format français
const formatDateFrancais = (dateISO: string): string => {
  if (!dateISO) return '';
  const date = new Date(dateISO);
  return date.toLocaleDateString('fr-FR');
};

const GestionPeriodesStage: React.FC = () => {
  const [periodes, setPeriodes] = useState<PeriodeStage[]>([]);
  const [form, setForm] = useState<Omit<PeriodeStage, 'id'>>({ nom: '', dateDebut: '', dateFin: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchPeriodes = async () => {
    setLoading(true);
    setPeriodes(await getPeriodesStage());
    setLoading(false);
  };

  useEffect(() => { fetchPeriodes(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updatePeriodeStage(editId, form);
      setEditId(null);
    } else {
      await addPeriodeStage(form);
    }
    setForm({ nom: '', dateDebut: '', dateFin: '' });
    setShowForm(false);
    fetchPeriodes();
  };

  const handleEdit = (periode: PeriodeStage) => {
    setEditId(periode.id);
    setForm({ nom: periode.nom, dateDebut: periode.dateDebut, dateFin: periode.dateFin });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cette période ?')) {
      await deletePeriodeStage(id);
      fetchPeriodes();
    }
  };

  const calculateDuree = (dateDebut: string, dateFin: string): number => {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="loading">Chargement des périodes...</div>;
  }

  return (
    <div className="gestion-periodes-stage">
      <div className="header">
        <h1>Gestion des Périodes de Stage</h1>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({ nom: '', dateDebut: '', dateFin: '' });
          }}
        >
          Ajouter une période
        </button>
      </div>

      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editId ? 'Modifier la période' : 'Nouvelle période'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom de la période:</label>
                <input
                  name="nom"
                  type="text"
                  placeholder="Ex: PFMP1, PFMP2..."
                  value={form.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de début:</label>
                <input
                  name="dateDebut"
                  type="date"
                  value={form.dateDebut}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin:</label>
                <input
                  name="dateFin"
                  type="date"
                  value={form.dateFin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editId ? 'Modifier' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setForm({ nom: '', dateDebut: '', dateFin: '' });
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="periodes-grid">
        {periodes.map(periode => {
          const duree = calculateDuree(periode.dateDebut, periode.dateFin);
          return (
            <div key={periode.id} className="periode-tile">
              <div className="periode-content">
                <h3>{periode.nom}</h3>
                <div className="periode-dates">
                  <div className="date-item">
                    <span className="date-label">Début</span>
                    <span className="date-value">{formatDateFrancais(periode.dateDebut)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Fin</span>
                    <span className="date-value">{formatDateFrancais(periode.dateFin)}</span>
                  </div>
                </div>
                <div className="periode-duree">
                  <span className="duree-number">{duree}</span>
                  <span className="duree-label">jours</span>
                </div>
              </div>
              <div className="periode-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(periode)}
                  title="Modifier"
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(periode.id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {periodes.length === 0 && (
        <div className="empty-state">
          <p>Aucune période de stage enregistrée</p>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Créer la première période
          </button>
        </div>
      )}
    </div>
  );
};

export default GestionPeriodesStage; 
