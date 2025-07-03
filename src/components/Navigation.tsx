import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button 
          className="menu-toggle" 
          onClick={toggleMenu}
          aria-label="Menu"
        >
          ☰
        </button>
        
        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          {currentUser && (
            <>
              <div className="user-info">
                <p>Connecté en tant que :</p>
                <strong>{currentUser.prenom} {currentUser.nom}</strong>
                <span className="user-role">({currentUser.role})</span>
              </div>
              
              <div className="nav-links">
                <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Accueil
                </Link>
                {currentUser.role === 'admin' && (
                  <Link to="/classes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Gérer les classes
                  </Link>
                )}
                {currentUser.role === 'admin' && (
                  <Link to="/periodes-stage" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Périodes de stage
                  </Link>
                )}
                <Link to="/evaluations" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Évaluer un élève
                </Link>
                <Link to="/rapports" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Exporter rapports
                </Link>
                {currentUser.role === 'admin' && (
                  <Link to="/comptes" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Gestion des comptes
                  </Link>
                )}
              </div>
              
              <div className="nav-actions">
                <button onClick={handleLogout} className="logout-button">
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 