import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import GestionClasses from './components/GestionClasses';
import GestionPeriodesStage from './components/GestionPeriodesStage';
import EvaluationEleve from './components/EvaluationEleve';
import ExportRapports from './components/ExportRapports';
import GestionUtilisateurs from './components/GestionUtilisateurs';
import './App.css';

// Composant pour la page d'accueil
const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  const tiles = [
    {
      label: 'Gérer les classes',
      description: 'Créez, modifiez et supprimez les classes',
      link: '/classes',
      show: currentUser?.role === 'admin',
      icon: '🏫',
    },
    {
      label: 'Gérer les stages',
      description: 'Définissez les périodes de stage (PFMP1, PFMP2...)',
      link: '/periodes-stage',
      show: currentUser?.role === 'admin',
      icon: '💼',
    },
    {
      label: 'Évaluer un élève',
      description: 'Remplissez une fiche d\'évaluation',
      link: '/evaluations',
      show: true,
      icon: '📝',
    },
    {
      label: 'Exporter rapports',
      description: 'Téléchargez les rapports de suivi',
      link: '/rapports',
      show: true,
      icon: '📊',
    },
    {
      label: 'Gestion des comptes',
      description: 'Gérez les comptes utilisateurs',
      link: '/comptes',
      show: currentUser?.role === 'admin',
      icon: '👤',
    },
  ];

  return (
    <div className="app home-landing dark"> 
      <main className="main" style={{ minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
          gestion des PFMP de seconde MTNE
        </h1>
        <p style={{ textAlign: 'center', fontSize: '1.3rem', marginBottom: '2.5rem', color: '#bbb' }}>
          Plateforme moderne pour la gestion des stages, des élèves et des évaluations
        </p>
        <div className="tiles-grid">
          {tiles.filter(tile => tile.show).map(tile => (
            <Link key={tile.label} to={tile.link} className="tile-card">
              <div className="tile-icon">{tile.icon}</div>
              <div className="tile-title">{tile.label}</div>
              <div className="tile-desc">{tile.description}</div>
            </Link>
          ))}
        </div>
        {currentUser && (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: '#888' }}>
            Connecté en tant que : {currentUser.prenom} {currentUser.nom} ({currentUser.role})
          </p>
        )}
      </main>
    </div>
  );
};

// Composant pour les routes protégées
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Composant pour les routes d'administration
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Composant principal avec mode sombre permanent
const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="app dark">
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/classes" 
            element={
              <AdminRoute>
                <GestionClasses />
              </AdminRoute>
            } 
          />
          <Route 
            path="/periodes-stage" 
            element={
              <AdminRoute>
                <GestionPeriodesStage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/evaluations" 
            element={
              <ProtectedRoute>
                <EvaluationEleve />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rapports" 
            element={
              <ProtectedRoute>
                <ExportRapports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/comptes" 
            element={
              <AdminRoute>
                <GestionUtilisateurs />
              </AdminRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

// Composant principal avec providers
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 
