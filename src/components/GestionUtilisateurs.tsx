import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import './GestionUtilisateurs.css';

const GestionUtilisateurs: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'professeur' as 'admin' | 'professeur'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('tous');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du mot de passe pour les nouveaux utilisateurs
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      if (editingUser) {
        // Modification (sans mot de passe)
        const updateData = {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role
        };
        await userService.updateUser(editingUser.id, updateData);
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...updateData }
            : user
        ));
      } else {
        // Création avec mot de passe
        const newUserId = await userService.createUserWithAuth({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        const newUser: User = {
          id: newUserId,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          role: formData.role,
          createdAt: new Date()
        };
        setUsers([...users, newUser]);
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'utilisateur');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: '', // Ne pas préremplir le mot de passe
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.nom} ${user.prenom} ?`)) {
      try {
        await userService.deleteUser(user.id);
        setUsers(users.filter(u => u.id !== user.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'professeur'
    });
    setEditingUser(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'tous' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 'Admin' : 'Professeur';
  };

  const getRoleClass = (role: string) => {
    return role === 'admin' ? 'role-admin' : 'role-professeur';
  };

  if (loading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="gestion-utilisateurs">
      <div className="header">
        <h2>Gestion des utilisateurs</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Nouvel utilisateur
        </button>
      </div>

      <div className="filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="tous">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="professeur">Professeurs</option>
          </select>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Total utilisateurs</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.role === 'admin').length}</h3>
          <p>Administrateurs</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.role === 'professeur').length}</h3>
          <p>Professeurs</p>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="user-nom">{user.nom}</td>
                <td className="user-prenom">{user.prenom}</td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleClass(user.role)}`}>
                    {getRoleBadge(user.role)}
                  </span>
                </td>
                <td className="user-date">
                  {user.createdAt.toLocaleDateString('fr-FR')}
                </td>
                <td className="actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(user)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(user)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal pour ajouter/modifier un utilisateur */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nom">Nom *</label>
                  <input
                    type="text"
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="prenom">Prénom *</label>
                  <input
                    type="text"
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              {!editingUser && (
                <div className="form-group">
                  <label htmlFor="password">Mot de passe *</label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                  <small className="form-help">
                    Le mot de passe doit contenir au moins 6 caractères
                  </small>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="role">Rôle</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'professeur'})}
                >
                  <option value="professeur">Professeur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-save">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionUtilisateurs; 
