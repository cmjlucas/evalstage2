import React, { useEffect, useState } from 'react';
import { eleveService } from '../services/userService';
import { Eleve, Classe } from '../types';
import { classeService } from '../services/classeService';
import './GestionEleves.css';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const GestionEleves: React.FC = () => {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', classeId: '', email: '', dateNaissance: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEleves();
    loadClasses();
  }, []);

  const loadEleves = async () => {
    try {
      setLoading(true);
      const data = await eleveService.getAllEleves();
      setEleves(data);
    } catch (err) {
      setError('Erreur lors du chargement des élèves');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await classeService.getAllClasses();
      setClasses(data);
    } catch (err) {
      setError('Erreur lors du chargement des classes');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.classeId) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }
    try {
      if (editingEleve) {
        await eleveService.updateEleve(editingEleve.id, formData);
      } else {
        await eleveService.createEleve(formData);
      }
      setFormData({ nom: '', prenom: '', classeId: '', email: '', dateNaissance: '' });
      setEditingEleve(null);
      setShowForm(false);
      setError(null);
      await loadEleves();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement');
      console.error(err);
    }
  };

  const handleEdit = (eleve: Eleve) => {
    setEditingEleve(eleve);
    setFormData({
      nom: eleve.nom,
      prenom: eleve.prenom,
      classeId: eleve.classeId,
      email: eleve.email || '',
      dateNaissance: eleve.dateNaissance || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      try {
        await eleveService.deleteEleve(id);
        await loadEleves();
      } catch (err) {
        setError('Erreur lors de la suppression');
        console.error(err);
      }
    }
  };

  const cancelEdit = () => {
    setFormData({ nom: '', prenom: '', classeId: '', email: '', dateNaissance: '' });
    setEditingEleve(null);
    setShowForm(false);
    setError(null);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const hasSemicolon = text.includes(';');
        const result = Papa.parse(text, { header: true, delimiter: hasSemicolon ? ';' : ',' });
        // Nettoyer les noms de colonnes et ignorer les lignes vides
        rows = (result.data as any[]).filter(r => Object.values(r).some(v => v && String(v).trim() !== ''));
        if (rows.length > 0) {
          // On retire les espaces autour des clés
          rows = rows.map(r => {
            const cleaned: any = {};
            Object.keys(r).forEach(k => {
              cleaned[k.trim()] = typeof r[k] === 'string' ? r[k].trim() : r[k];
            });
            return cleaned;
          });
        }
      } else if (file.name.endsWith('.xlsx')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else {
        setError('Format de fichier non supporté. Utilisez .csv ou .xlsx');
        return;
      }
      // Vérifier les colonnes requises
      const required = ['nom', 'prenom', 'classe'];
      const firstRow = rows[0] || {};
      const detectedCols = Object.keys(firstRow).join(', ');
      for (const col of required) {
        if (!Object.keys(firstRow).includes(col)) {
          setError(`Colonne manquante ou vide : ${col}. Colonnes détectées : ${detectedCols}`);
          return;
        }
      }
      for (const r of rows) {
        for (const col of required) {
          if (!r[col]) {
            setError(`Colonne manquante ou vide : ${col}. Colonnes détectées : ${detectedCols}`);
            return;
          }
        }
      }
      // Vérifier que les classes existent
      const classMap = new Map(classes.map(c => [c.nom, c.id]));
      const missingClasses = Array.from(new Set(rows.map(r => r.classe).filter(nom => !classMap.has(nom))));
      if (missingClasses.length > 0) {
        setError('Classe(s) inconnue(s) : ' + missingClasses.join(', '));
        return;
      }
      // Importer chaque élève
      for (const r of rows) {
        await eleveService.createEleve({
          nom: r.nom,
          prenom: r.prenom,
          classeId: String(classMap.get(r.classe)),
          email: r.email || '',
          dateNaissance: r.dateNaissance || '',
        });
      }
      await loadEleves();
      setError(null);
      alert('Import terminé !');
    } catch (err) {
      setError('Erreur lors de l\'import : ' + (err as any).message);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des élèves...</div>;
  }

  return (
    <div className="gestion-eleves">
      <div className="header">
        <h2>Gestion des Élèves</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Ajouter un élève
          </button>
          <label className="btn-primary" style={{ cursor: 'pointer', margin: 0 }}>
            Importer des élèves
            <input type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h3>{editingEleve ? 'Modifier l\'élève' : 'Nouvel élève'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nom">Nom</label>
                <input type="text" id="nom" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <input type="text" id="prenom" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="classeId">Classe</label>
                <select id="classeId" value={formData.classeId} onChange={e => setFormData({ ...formData, classeId: e.target.value })} required>
                  <option value="">Sélectionner une classe</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>{classe.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="dateNaissance">Date de naissance</label>
                <input type="date" id="dateNaissance" value={formData.dateNaissance} onChange={e => setFormData({ ...formData, dateNaissance: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingEleve ? 'Modifier' : 'Créer'}</button>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Annuler</button>
                {!editingEleve && (
                  <button type="button" className="btn-primary" onClick={async () => {
                    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.classeId) {
                      setError('Tous les champs obligatoires doivent être remplis');
                      return;
                    }
                    try {
                      await eleveService.createEleve(formData);
                      setFormData({ nom: '', prenom: '', classeId: '', email: '', dateNaissance: '' });
                      setError(null);
                      await loadEleves();
                    } catch (err) {
                      setError('Erreur lors de la création');
                      console.error(err);
                    }
                  }}>
                    Créer et ajouter un autre
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="eleves-grid">
        {eleves.length === 0 ? (
          <div className="empty-state">
            <p>Aucun élève trouvé</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Créer le premier élève
            </button>
          </div>
        ) : (
          eleves.map(eleve => (
            <div key={eleve.id} className="eleve-card">
              <div className="eleve-info">
                <h3>{eleve.prenom} {eleve.nom}</h3>
                <p>Classe : {classes.find(c => c.id === eleve.classeId)?.nom || 'Inconnue'}</p>
                <p>Email : {eleve.email || 'Non renseigné'}</p>
                <p>Date de naissance : {eleve.dateNaissance || 'Non renseignée'}</p>
                <p>Créé le {(() => {
                  let date = eleve.createdAt;
                  if (!(date instanceof Date)) date = new Date(date);
                  return isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString('fr-FR');
                })()}</p>
              </div>
              <div className="eleve-actions">
                <button className="btn-edit" onClick={() => handleEdit(eleve)}>Modifier</button>
                <button className="btn-delete" onClick={() => handleDelete(eleve.id)}>Supprimer</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GestionEleves; 
