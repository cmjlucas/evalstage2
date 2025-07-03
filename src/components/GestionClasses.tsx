import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './GestionClasses.css';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface Classe {
  id: string;
  nom: string;
  annee: string;
  effectif: number;
  professeurPrincipal: string;
  createdAt: Date;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  classeId: string;
  dateNaissance: string;
}

interface ClasseWithEffectif {
  id: string;
  nom: string;
  effectif: number;
}

const GestionClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClasseWithEffectif[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEleveForm, setShowEleveForm] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [editingClass, setEditingClass] = useState<Classe | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    annee: new Date().getFullYear().toString(),
    professeurPrincipal: ''
  });
  const [eleveFormData, setEleveFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: ''
  });

  useEffect(() => {
    loadClasses();
    loadEleves();
  }, []);

  const loadClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      const classesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Classe[];

      // Calculer l'effectif pour chaque classe
      const classesWithEffectif = await Promise.all(
        classesData.map(async (classe) => {
          const elevesQuery = query(collection(db, 'eleves'), where('classeId', '==', classe.id));
          const elevesSnapshot = await getDocs(elevesQuery);
          return {
            id: classe.id,
            nom: classe.nom,
            effectif: elevesSnapshot.size
          };
        })
      );

      setClasses(classesWithEffectif);
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEleves = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'eleves'));
      const elevesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Eleve[];
      setEleves(elevesData);
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await updateDoc(doc(db, 'classes', editingClass.id), {
          ...formData,
          updatedAt: new Date()
        });
        setEditingClass(null);
      } else {
        await addDoc(collection(db, 'classes'), {
          ...formData,
          createdAt: new Date()
        });
      }
      setFormData({
        nom: '',
        annee: new Date().getFullYear().toString(),
        professeurPrincipal: ''
      });
      setShowForm(false);
      loadClasses();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEleveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClasse) {
      alert('Veuillez sélectionner une classe');
      return;
    }
    try {
      await addDoc(collection(db, 'eleves'), {
        ...eleveFormData,
        classeId: selectedClasse,
        createdAt: new Date()
      });
      setEleveFormData({ nom: '', prenom: '', dateNaissance: '' });
      setShowEleveForm(false);
      loadEleves();
      loadClasses(); // Recharger pour mettre à jour l'effectif
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'élève:', error);
    }
  };

  const handleImportEleves = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClasse) {
      alert('Veuillez sélectionner une classe et un fichier');
      return;
    }

    try {
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const hasSemicolon = text.includes(';');
        const result = Papa.parse(text, { header: true, delimiter: hasSemicolon ? ';' : ',' });
        rows = (result.data as any[]).filter(r => Object.values(r).some(v => v && String(v).trim() !== ''));
      } else if (file.name.endsWith('.xlsx')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else {
        alert('Format de fichier non supporté. Utilisez .csv ou .xlsx');
        return;
      }

      // Vérifier les colonnes requises
      const required = ['nom', 'prenom', 'dateNaissance'];
      const firstRow = rows[0] || {};
      for (const col of required) {
        if (!Object.keys(firstRow).includes(col)) {
          alert(`Colonne manquante : ${col}`);
          return;
        }
      }

      // Importer chaque élève
      for (const row of rows) {
        await addDoc(collection(db, 'eleves'), {
          nom: row.nom.trim(),
          prenom: row.prenom.trim(),
          dateNaissance: row.dateNaissance,
          classeId: selectedClasse,
          createdAt: new Date()
        });
      }

      loadEleves();
      loadClasses();
      alert('Import terminé !');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import');
    }
  };

  const handleEdit = (classe: Classe) => {
    setEditingClass(classe);
    setFormData({
      nom: classe.nom,
      annee: classe.annee,
      professeurPrincipal: classe.professeurPrincipal
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      try {
        await deleteDoc(doc(db, 'classes', id));
        loadClasses();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteEleve = async (eleveId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      try {
        await deleteDoc(doc(db, 'eleves', eleveId));
        loadEleves();
        loadClasses();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getElevesByClasse = (classeId: string) => {
    return eleves.filter(eleve => eleve.classeId === classeId);
  };

  if (loading) {
    return <div className="loading">Chargement des classes...</div>;
  }

  return (
    <div className="gestion-classes">
      <div className="header">
        <h1>Gestion des Classes</h1>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingClass(null);
            setFormData({
              nom: '',
              annee: new Date().getFullYear().toString(),
              professeurPrincipal: ''
            });
          }}
        >
          Ajouter une classe
        </button>
      </div>

      {/* Formulaire de classe */}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>{editingClass ? 'Modifier la classe' : 'Nouvelle classe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom de la classe:</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Année scolaire:</label>
                <input
                  type="text"
                  value={formData.annee}
                  onChange={(e) => setFormData({...formData, annee: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Professeur principal:</label>
                <input
                  type="text"
                  value={formData.professeurPrincipal}
                  onChange={(e) => setFormData({...formData, professeurPrincipal: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Modifier' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClass(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire d'élève */}
      {showEleveForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>Ajouter un élève</h2>
            <form onSubmit={handleEleveSubmit}>
              <div className="form-group">
                <label>Classe:</label>
                <select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  value={eleveFormData.nom}
                  onChange={(e) => setEleveFormData({...eleveFormData, nom: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  value={eleveFormData.prenom}
                  onChange={(e) => setEleveFormData({...eleveFormData, prenom: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de naissance:</label>
                <input
                  type="date"
                  value={eleveFormData.dateNaissance}
                  onChange={(e) => setEleveFormData({...eleveFormData, dateNaissance: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Ajouter
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowEleveForm(false);
                    setSelectedClasse('');
                    setEleveFormData({ nom: '', prenom: '', dateNaissance: '' });
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="classes-grid">
        {classes.map(classe => {
          const classeEleves = getElevesByClasse(classe.id);
          return (
            <div key={classe.id} className="class-tile">
              <div className="class-content">
                <h3>{classe.nom}</h3>
                <div className="effectif">
                  <span className="effectif-number">{classe.effectif}</span>
                  <span className="effectif-label">élèves</span>
                </div>
              </div>
              
              {/* Liste des élèves */}
              {classeEleves.length > 0 && (
                <div className="eleves-list">
                  <h4>Élèves :</h4>
                  <div className="eleves-container">
                    {classeEleves.map(eleve => (
                      <div key={eleve.id} className="eleve-item">
                        <span>{eleve.prenom} {eleve.nom}</span>
                        <button 
                          className="btn-delete-small"
                          onClick={() => handleDeleteEleve(eleve.id)}
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="class-actions">
                <button 
                  className="btn-add-eleve"
                  onClick={() => {
                    setSelectedClasse(classe.id);
                    setShowEleveForm(true);
                  }}
                  title="Ajouter un élève"
                >
                  👤+
                </button>
                <button 
                  className="btn-import"
                  onClick={() => {
                    setSelectedClasse(classe.id);
                    document.getElementById('import-file')?.click();
                  }}
                  title="Importer des élèves"
                >
                  📁
                </button>
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(classe as any)}
                  title="Modifier"
                >
                  ✏️
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(classe.id)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input caché pour l'import */}
      <input
        id="import-file"
        type="file"
        accept=".csv,.xlsx"
        style={{ display: 'none' }}
        onChange={handleImportEleves}
      />

      {classes.length === 0 && (
        <div className="empty-state">
          <p>Aucune classe enregistrée</p>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Créer la première classe
          </button>
        </div>
      )}
    </div>
  );
};

export default GestionClasses; 