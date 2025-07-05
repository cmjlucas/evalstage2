import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './ExportRapports.css';

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

interface PeriodeStage {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
}

interface Evaluation {
  id: string;
  eleveId: string;
  periodeId: string;
  dateEvaluation: Date;
  nomEntreprise: string;
  domaineActivite: string;
  competences: {
    cc1_collecter_donnees: { niveau: string; commentaire: string };
    cc2_ordonner_donnees: { niveau: string; commentaire: string };
    cc2_reperer_contraintes: { niveau: string; commentaire: string };
    cc3_identifier_elements: { niveau: string; commentaire: string };
    cc3_identifier_grandeurs: { niveau: string; commentaire: string };
    cc3_representer_installation: { niveau: string; commentaire: string };
    cc4_implanter_cabler: { niveau: string; commentaire: string };
    cc4_realiser_installation: { niveau: string; commentaire: string };
    cc4_operer_attitude: { niveau: string; commentaire: string };
    cc7_controler_donnees: { niveau: string; commentaire: string };
    cc7_constater_defaillance: { niveau: string; commentaire: string };
    cc7_lister_hypotheses: { niveau: string; commentaire: string };
    cc8_completer_documents: { niveau: string; commentaire: string };
    cc8_expliquer_avancement: { niveau: string; commentaire: string };
    cc8_rediger_compte_rendu: { niveau: string; commentaire: string };
    cc9_interpreter_informations: { niveau: string; commentaire: string };
    cc9_expliquer_fonctionnement: { niveau: string; commentaire: string };
    cc9_informer_consignes: { niveau: string; commentaire: string };
  };
  commentaireGeneral: string;
  recommandations: string;
  nomTuteur?: string;
}

const ExportRapports: React.FC = () => {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeStage[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEleve, setSelectedEleve] = useState<string>('');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [searchEleve, setSearchEleve] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Export: Chargement des données...');
      
      const elevesSnapshot = await getDocs(collection(db, 'eleves'));
      const elevesData = elevesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Eleve[];
      setEleves(elevesData);
      console.log('Export: Élèves chargés:', elevesData.length);

      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Classe[];
      setClasses(classesData);
      console.log('Export: Classes chargées:', classesData.length);

      console.log('Export: Chargement des périodes depuis "periodesStage"...');
      const periodesSnapshot = await getDocs(collection(db, 'periodesStage'));
      const periodesData = periodesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PeriodeStage[];
      setPeriodes(periodesData);
      console.log('Export: Périodes chargées:', periodesData.length, periodesData);

      const evaluationsSnapshot = await getDocs(collection(db, 'evaluations'));
      const evaluationsData = evaluationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateEvaluation: doc.data().dateEvaluation?.toDate() || new Date()
      })) as Evaluation[];
      setEvaluations(evaluationsData);
      console.log('Export: Évaluations chargées:', evaluationsData.length);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
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

  const getNiveauSymbol = (niveau: string): string => {
    switch (niveau) {
      case 'non_evaluee': return '';
      case 'non_acquise': return '1';
      case 'en_cours': return '2';
      case 'partiellement_acquise': return '3';
      case 'acquise': return '4';
      default: return '';
    }
  };

  const getNiveauColor = (niveau: string): string => {
    switch (niveau) {
      case 'non_evaluee': return '#c8c8c8'; // Gris
      case 'non_acquise': return '#ff4444'; // Rouge
      case 'en_cours': return '#ff8800'; // Orange
      case 'partiellement_acquise': return '#ffaa00'; // Jaune/Orange
      case 'acquise': return '#00aa44'; // Vert
      default: return '#c8c8c8'; // Gris par défaut
    }
  };

  const getNiveauText = (niveau: string): string => {
    switch (niveau) {
      case 'non_evaluee': return 'Non évaluée';
      case 'non_acquise': return 'Non acquise';
      case 'en_cours': return 'En cours';
      case 'partiellement_acquise': return 'Partiellement acquise';
      case 'acquise': return 'Acquise';
      default: return 'Non évaluée';
    }
  };

  const drawColoredSquare = (pdf: jsPDF, x: number, y: number, niveau: string) => {
    const squareSize = 4;
    
    // Définir la couleur selon le niveau
    switch (niveau) {
      case 'non_evaluee':
        pdf.setFillColor(200, 200, 200); // Gris
        break;
      case 'non_acquise':
        pdf.setFillColor(255, 68, 68); // Rouge
        break;
      case 'en_cours':
        pdf.setFillColor(255, 136, 0); // Orange
        break;
      case 'partiellement_acquise':
        pdf.setFillColor(255, 170, 0); // Jaune/Orange
        break;
      case 'acquise':
        pdf.setFillColor(0, 170, 68); // Vert
        break;
      default:
        pdf.setFillColor(200, 200, 200); // Gris par défaut
    }
    
    // Dessiner le carré rempli
    pdf.rect(x, y - squareSize/2, squareSize, squareSize, 'F');
  };

  const drawEvaluationTable = (pdf: jsPDF, yPosition: number, evaluation: any) => {
    const tableStartY = yPosition;
    const rowHeight = 6;
    const colWidths = [100, 12, 12, 12, 12, 12]; // Largeurs des colonnes
    let x = 15;
    
    // En-têtes du tableau
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    
    // Dessiner les bordures d'en-tête
    pdf.rect(x, tableStartY, colWidths[0], rowHeight); // Critères d'évaluation
    pdf.rect(x + colWidths[0], tableStartY, colWidths[1], rowHeight); // Non évaluée
    pdf.rect(x + colWidths[0] + colWidths[1], tableStartY, colWidths[2], rowHeight); // Non acquise
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2], tableStartY, colWidths[3], rowHeight); // En cours
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableStartY, colWidths[4], rowHeight); // Partiellement acquise
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableStartY, colWidths[5], rowHeight); // Acquise
    
    // Texte des en-têtes
    pdf.text('Critères d\'évaluation', x + 2, tableStartY + 4);
    
    // Colorier les en-têtes des colonnes d'évaluation
    pdf.setFillColor(200, 200, 200); // Gris
    pdf.rect(x + colWidths[0], tableStartY, colWidths[1], rowHeight, 'F');
    
    pdf.setFillColor(255, 68, 68); // Rouge
    pdf.rect(x + colWidths[0] + colWidths[1], tableStartY, colWidths[2], rowHeight, 'F');
    
    pdf.setFillColor(255, 136, 0); // Orange
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2], tableStartY, colWidths[3], rowHeight, 'F');
    
    pdf.setFillColor(255, 170, 0); // Jaune
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableStartY, colWidths[4], rowHeight, 'F');
    
    pdf.setFillColor(0, 170, 68); // Vert
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableStartY, colWidths[5], rowHeight, 'F');
    
    // Ajouter les en-têtes des colonnes d'évaluation
    pdf.setFontSize(6);
    pdf.text('Non', x + colWidths[0] + 1, tableStartY + 2);
    pdf.text('évaluée', x + colWidths[0] + 1, tableStartY + 5);
    
    pdf.text('Non', x + colWidths[0] + colWidths[1] + 1, tableStartY + 2);
    pdf.text('acquise', x + colWidths[0] + colWidths[1] + 1, tableStartY + 5);
    
    pdf.text('En cours', x + colWidths[0] + colWidths[1] + colWidths[2] + 1, tableStartY + 2);
    pdf.text('d\'acquisit.', x + colWidths[0] + colWidths[1] + colWidths[2] + 1, tableStartY + 5);
    
    pdf.text('Partiel.', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 1, tableStartY + 2);
    pdf.text('acquise', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 1, tableStartY + 5);
    
    pdf.text('Acquise', x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 1, tableStartY + 4);
    
    // Redessiner les bordures après le remplissage
    pdf.rect(x, tableStartY, colWidths[0], rowHeight);
    pdf.rect(x + colWidths[0], tableStartY, colWidths[1], rowHeight);
    pdf.rect(x + colWidths[0] + colWidths[1], tableStartY, colWidths[2], rowHeight);
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2], tableStartY, colWidths[3], rowHeight);
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableStartY, colWidths[4], rowHeight);
    pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableStartY, colWidths[5], rowHeight);
    
    let currentY = tableStartY + rowHeight;
    
    // Définir les compétences et leurs sous-compétences
    const competencesData = [
      {
        section: 'CC1 - S\'informer sur l\'intervention ou la réalisation',
        competences: [
          { key: 'cc1_collecter_donnees', label: 'Collecter les données nécessaires à l\'intervention' }
        ]
      },
      {
        section: 'CC2 - Organiser la réalisation ou l\'intervention',
        competences: [
          { key: 'cc2_ordonner_donnees', label: 'Ordonner les données nécessaires' },
          { key: 'cc2_reperer_contraintes', label: 'Repérer les contraintes énergétiques' }
        ]
      },
      {
        section: 'CC3 - Analyser et exploiter les données',
        competences: [
          { key: 'cc3_identifier_elements', label: 'Identifier les éléments du système' },
          { key: 'cc3_identifier_grandeurs', label: 'Identifier les grandeurs physiques' },
          { key: 'cc3_representer_installation', label: 'Représenter l\'installation' }
        ]
      },
      {
        section: 'CC4 - Réaliser une installation ou une intervention',
        competences: [
          { key: 'cc4_implanter_cabler', label: 'Implanter, câbler les matériels' },
          { key: 'cc4_realiser_installation', label: 'Réaliser l\'installation' },
          { key: 'cc4_operer_attitude', label: 'Opérer avec attitude écoresponsable' }
        ]
      },
      {
        section: 'CC7 - Établir un pré-diagnostic à distance',
        competences: [
          { key: 'cc7_controler_donnees', label: 'Contrôler les données d\'exploitation' },
          { key: 'cc7_constater_defaillance', label: 'Constater la défaillance' },
          { key: 'cc7_lister_hypotheses', label: 'Lister les hypothèses de panne' }
        ]
      },
      {
        section: 'CC8 - Renseigner les documents',
        competences: [
          { key: 'cc8_completer_documents', label: 'Compléter les documents techniques' },
          { key: 'cc8_expliquer_avancement', label: 'Expliquer l\'avancement des opérations' },
          { key: 'cc8_rediger_compte_rendu', label: 'Rédiger un compte-rendu' }
        ]
      },
      {
        section: 'CC9 - Communiquer avec le client et/ou l\'usager',
        competences: [
          { key: 'cc9_interpreter_informations', label: 'Interpréter les informations du client' },
          { key: 'cc9_expliquer_fonctionnement', label: 'Expliquer le fonctionnement' },
          { key: 'cc9_informer_consignes', label: 'Informer des consignes de sécurité' }
        ]
      }
    ];
    
    // Dessiner les lignes du tableau
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    competencesData.forEach(section => {
      section.competences.forEach(competence => {
        const niveau = evaluation.competences[competence.key]?.niveau || 'non_evaluee';
        
        // Dessiner la ligne
        pdf.rect(x, currentY, colWidths[0], rowHeight);
        pdf.rect(x + colWidths[0], currentY, colWidths[1], rowHeight);
        pdf.rect(x + colWidths[0] + colWidths[1], currentY, colWidths[2], rowHeight);
        pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], rowHeight);
        pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY, colWidths[4], rowHeight);
        pdf.rect(x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], currentY, colWidths[5], rowHeight);
        
        // Texte de la compétence
        const lines = pdf.splitTextToSize(competence.label, colWidths[0] - 4);
        pdf.text(lines, x + 2, currentY + 3);
        
        // Marquer la case correspondante selon le niveau
        let caseX = x + colWidths[0] + 2;
        
        switch (niveau) {
          case 'non_evaluee':
            pdf.setFillColor(200, 200, 200);
            pdf.rect(caseX, currentY + 1, colWidths[1] - 4, 4, 'F');
            break;
          case 'non_acquise':
            caseX += colWidths[1];
            pdf.setFillColor(255, 68, 68);
            pdf.rect(caseX + 2, currentY + 1, colWidths[2] - 4, 4, 'F');
            break;
          case 'en_cours':
            caseX += colWidths[1] + colWidths[2];
            pdf.setFillColor(255, 136, 0);
            pdf.rect(caseX + 2, currentY + 1, colWidths[3] - 4, 4, 'F');
            break;
          case 'partiellement_acquise':
            caseX += colWidths[1] + colWidths[2] + colWidths[3];
            pdf.setFillColor(255, 170, 0);
            pdf.rect(caseX + 2, currentY + 1, colWidths[4] - 4, 4, 'F');
            break;
          case 'acquise':
            caseX += colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4];
            pdf.setFillColor(0, 170, 68);
            pdf.rect(caseX + 2, currentY + 1, colWidths[5] - 4, 4, 'F');
            break;
        }
        
        currentY += rowHeight;
      });
    });
    
    return currentY;
  };

  const exportToPDF = () => {
    if (!selectedEleve || !selectedPeriode) return;

    const eleve = eleves.find(e => e.id === selectedEleve);
    const classe = classes.find(c => c.id === eleve?.classeId);
    const periode = periodes.find(p => p.id === selectedPeriode);
    const evaluation = evaluations.find(e => e.eleveId === selectedEleve && e.periodeId === selectedPeriode);

    if (!eleve || !periode) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 15;

    // En-tête avec logo (si disponible)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SECONDE MÉTIERS DES TRANSITIONS NUMÉRIQUE ET ÉNERGÉTIQUE', 15, yPosition);
    yPosition += 10;

    // Cadre titre
    pdf.setFillColor(210, 180, 210); // Fond violet clair
    pdf.rect(15, yPosition, pageWidth - 30, 15, 'F');
    pdf.rect(15, yPosition, pageWidth - 30, 15); // Bordure
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Document de suivi et d\'évaluation :', 20, yPosition + 6);
    pdf.text('Situations de travail spécifiées et réalisées en milieu professionnel', 20, yPosition + 12);
    yPosition += 25;

    // Titre PFMP dans un cadre
    pdf.rect(15, yPosition, 100, 15);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`PFMP N° ${periode.nom.replace('PFMP', '').replace('-', '').trim()}`, 20, yPosition + 10);
    
    // Dates à droite
    pdf.rect(pageWidth - 80, yPosition, 65, 15);
    pdf.setFontSize(10);
    pdf.text(`Du ${formatDateFromString(periode.dateDebut)}`, pageWidth - 75, yPosition + 6);
    pdf.text(`au ${formatDateFromString(periode.dateFin)}`, pageWidth - 75, yPosition + 12);
    yPosition += 25;

    // Nom du candidat
    pdf.rect(15, yPosition, pageWidth - 30, 8);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOM - PRÉNOM DU CANDIDAT', 20, yPosition + 6);
    yPosition += 8;

    pdf.rect(15, yPosition, pageWidth - 30, 12);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${eleve.nom.toUpperCase()}--${eleve.prenom}`, 20, yPosition + 8);
    yPosition += 12;

    // Nom du tuteur
    if (evaluation && evaluation.nomTuteur) {
      pdf.rect(15, yPosition, pageWidth - 30, 8);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tuteur en entreprise : ${evaluation.nomTuteur}`, 20, yPosition + 6);
      yPosition += 8;
    }

    // Dénomination et secteur
    pdf.rect(15, yPosition, pageWidth - 30, 8);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Dénomination et secteur d\'activité du milieu professionnel de formation', 20, yPosition + 6);
    yPosition += 8;

    // Espace pour l'entreprise
    pdf.rect(15, yPosition, pageWidth - 30, 15);
    if (evaluation && evaluation.nomEntreprise) {
      pdf.setFontSize(10);
      pdf.text(`${evaluation.nomEntreprise}`, 20, yPosition + 6);
      if (evaluation.domaineActivite) {
        pdf.text(`${evaluation.domaineActivite}`, 20, yPosition + 12);
      }
    }
    yPosition += 25;

    // Titre évaluation compétences
    pdf.setFillColor(200, 200, 200); // Fond gris
    pdf.rect(15, yPosition, pageWidth - 30, 8, 'F');
    pdf.rect(15, yPosition, pageWidth - 30, 8); // Bordure
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ÉVALUATION DES COMPÉTENCES ACQUISES EN PFMP', 20, yPosition + 6);
    yPosition += 15;

    // Légende explicative
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Liste des compétences pouvant être évaluées en', 15, yPosition);
    pdf.text('seconde MTNE', 15, yPosition + 4);
    pdf.text('Pour évaluer, remplir la case', 15, yPosition + 8);
    pdf.text('correspondante avec une croix', 15, yPosition + 12);
    yPosition += 20;

    // Légende des couleurs
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Légende des couleurs :', 15, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'normal');
    // Carré gris
    pdf.setFillColor(200, 200, 200);
    pdf.rect(15, yPosition, 4, 4, 'F');
    pdf.text('Non évaluée', 22, yPosition + 3);
    
    // Carré rouge
    pdf.setFillColor(255, 68, 68);
    pdf.rect(60, yPosition, 4, 4, 'F');
    pdf.text('Non acquise', 67, yPosition + 3);
    
    // Carré orange
    pdf.setFillColor(255, 136, 0);
    pdf.rect(110, yPosition, 4, 4, 'F');
    pdf.text('En cours', 117, yPosition + 3);
    
    // Carré jaune
    pdf.setFillColor(255, 170, 0);
    pdf.rect(150, yPosition, 4, 4, 'F');
    pdf.text('Partiel. acquise', 157, yPosition + 3);
    
    yPosition += 5;
    
    // Carré vert
    pdf.setFillColor(0, 170, 68);
    pdf.rect(15, yPosition, 4, 4, 'F');
    pdf.text('Acquise', 22, yPosition + 3);
    
    yPosition += 10;

    if (evaluation) {
      // Dessiner le tableau d'évaluation
      const pageHeight = pdf.internal.pageSize.height;
      let afterTableY = drawEvaluationTable(pdf, yPosition, evaluation);
      yPosition = afterTableY + 10;

      // Commentaires et observations
      if (evaluation.commentaireGeneral || evaluation.recommandations) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('OBSERVATIONS :', 15, yPosition);
        yPosition += 10;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        if (evaluation.commentaireGeneral) {
          const commentaireLines = pdf.splitTextToSize(evaluation.commentaireGeneral, pageWidth - 30);
          pdf.text(commentaireLines, 15, yPosition);
          yPosition += commentaireLines.length * 6 + 8;
        }
        if (evaluation.recommandations) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('RECOMMANDATIONS :', 15, yPosition);
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          const recommandationLines = pdf.splitTextToSize(evaluation.recommandations, pageWidth - 30);
          pdf.text(recommandationLines, 15, yPosition);
          yPosition += recommandationLines.length * 6 + 8;
        }
      }

      // Si la place restante est insuffisante, saute à une nouvelle page pour la signature
      const signatureBlockHeight = 30;
      if (yPosition + signatureBlockHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 30;
      } else {
        yPosition += 20;
      }
    }

    // Signature en bas de page (toujours aéré)
    const signatureY = pdf.internal.pageSize.height - 40;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Date et signature du tuteur entreprise :', 15, signatureY);
    pdf.text('Date et signature de l\'enseignant :', pageWidth - 110, signatureY);

    pdf.save(`PFMP_${eleve.nom}_${eleve.prenom}_${periode.nom}.pdf`);
  };

  const exportToExcel = () => {
    if (!selectedEleve || !selectedPeriode) return;

    const eleve = eleves.find(e => e.id === selectedEleve);
    const classe = classes.find(c => c.id === eleve?.classeId);
    const periode = periodes.find(p => p.id === selectedPeriode);
    const evaluation = evaluations.find(e => e.eleveId === selectedEleve && e.periodeId === selectedPeriode);

    if (!eleve || !periode) return;

    const data = [];
    data.push(['PFMP - Évaluation des compétences']);
    data.push(['']);
    data.push(['Élève:', `${eleve.nom} ${eleve.prenom}`]);
    data.push(['Classe:', classe?.nom || 'Non assignée']);
    data.push(['Période:', periode.nom]);
    data.push(['Du:', formatDateFromString(periode.dateDebut)]);
    data.push(['Au:', formatDateFromString(periode.dateFin)]);
    data.push(['']);
    if (evaluation && (evaluation.nomEntreprise || evaluation.domaineActivite)) {
      data.push(['ENTREPRISE D\'ACCUEIL']);
      if (evaluation.nomEntreprise) {
        data.push(['Nom:', evaluation.nomEntreprise]);
      }
      if (evaluation.domaineActivite) {
        data.push(['Domaine d\'activité:', evaluation.domaineActivite]);
      }
      data.push(['']);
    }
    data.push(['Compétence', 'Sous-compétence', 'Niveau']);

    if (evaluation) {
      const competences = evaluation.competences;
      
      data.push(['CC1 - S\'informer', 'Collecter les données', getNiveauSymbol(competences.cc1_collecter_donnees.niveau)]);
      
      data.push(['CC2 - Organiser', 'Ordonner les données', getNiveauSymbol(competences.cc2_ordonner_donnees.niveau)]);
      data.push(['', 'Repérer les contraintes', getNiveauSymbol(competences.cc2_reperer_contraintes.niveau)]);
      
      data.push(['CC3 - Analyser', 'Identifier les éléments', getNiveauSymbol(competences.cc3_identifier_elements.niveau)]);
      data.push(['', 'Identifier les grandeurs', getNiveauSymbol(competences.cc3_identifier_grandeurs.niveau)]);
      data.push(['', 'Représenter l\'installation', getNiveauSymbol(competences.cc3_representer_installation.niveau)]);
      
      data.push(['CC4 - Réaliser', 'Implanter, câbler', getNiveauSymbol(competences.cc4_implanter_cabler.niveau)]);
      data.push(['', 'Réaliser l\'installation', getNiveauSymbol(competences.cc4_realiser_installation.niveau)]);
      data.push(['', 'Attitude écoresponsable', getNiveauSymbol(competences.cc4_operer_attitude.niveau)]);
      
      data.push(['CC7 - Maintenance', 'Contrôler les données', getNiveauSymbol(competences.cc7_controler_donnees.niveau)]);
      data.push(['', 'Constater les défaillances', getNiveauSymbol(competences.cc7_constater_defaillance.niveau)]);
      data.push(['', 'Lister les hypothèses', getNiveauSymbol(competences.cc7_lister_hypotheses.niveau)]);
      
      data.push(['CC8 - Communication', 'Compléter les documents', getNiveauSymbol(competences.cc8_completer_documents.niveau)]);
      data.push(['', 'Expliquer l\'avancement', getNiveauSymbol(competences.cc8_expliquer_avancement.niveau)]);
      data.push(['', 'Rédiger compte rendu', getNiveauSymbol(competences.cc8_rediger_compte_rendu.niveau)]);
      
      data.push(['CC9 - Client/Usager', 'Interpréter les informations', getNiveauSymbol(competences.cc9_interpreter_informations.niveau)]);
      data.push(['', 'Expliquer le fonctionnement', getNiveauSymbol(competences.cc9_expliquer_fonctionnement.niveau)]);
      data.push(['', 'Informer sur les consignes', getNiveauSymbol(competences.cc9_informer_consignes.niveau)]);
      
      data.push(['']);
      data.push(['Commentaire général:', evaluation.commentaireGeneral]);
      data.push(['Recommandations:', evaluation.recommandations]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Évaluation PFMP');
    XLSX.writeFile(wb, `PFMP_${eleve.nom}_${eleve.prenom}_${periode.nom}.xlsx`);
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  // Fonction de normalisation (identique à EvaluationEleve)
  const normalizeText = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[00-\u036f]/g, '')
      .toLowerCase();
  };

  // Filtrage identique à EvaluationEleve
  const filteredEleves = eleves.filter(eleve => {
    const searchNormalized = normalizeText(searchEleve);
    const nomNormalized = normalizeText(eleve.nom);
    const prenomNormalized = normalizeText(eleve.prenom);
    const fullNameNormalized = normalizeText(`${eleve.prenom} ${eleve.nom}`);
    return (
      nomNormalized.includes(searchNormalized) ||
      prenomNormalized.includes(searchNormalized) ||
      fullNameNormalized.includes(searchNormalized)
    );
  }).sort((a, b) => {
    const nomA = a.nom.toLowerCase();
    const nomB = b.nom.toLowerCase();
    if (nomA < nomB) return -1;
    if (nomA > nomB) return 1;
    return a.prenom.toLowerCase().localeCompare(b.prenom.toLowerCase());
  });

  // Sélectionne un élève depuis la suggestion
  const handleSuggestionClick = (eleveId: string, nom: string, prenom: string) => {
    setSelectedEleve(eleveId);
    setSearchEleve(`${prenom} ${nom.toUpperCase()}`);
    setShowSuggestions(false);
  };

  // Ferme la liste de suggestions si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="export-rapports">
      <h2>Export des rapports PFMP</h2>
      
      <div className="export-form">
        <div className="form-group">
          <label htmlFor="eleve-select">Sélectionner un élève:</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Rechercher un élève (nom ou prénom)..."
              value={searchEleve}
              ref={inputRef}
              onFocus={() => setShowSuggestions(true)}
              onChange={e => {
                setSearchEleve(e.target.value);
                setShowSuggestions(true);
              }}
              className="search-input"
              style={{ marginBottom: '0.5rem', width: '100%' }}
            />
            {showSuggestions && searchEleve && filteredEleves.length > 0 && (
              <ul style={{
                position: 'absolute',
                zIndex: 10,
                background: 'white',
                border: '1px solid #ccc',
                width: '100%',
                maxHeight: '180px',
                overflowY: 'auto',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                color: '#111',
                fontWeight: 500
              }}>
                {filteredEleves.slice(0, 10).map(eleve => (
                  <li
                    key={eleve.id}
                    style={{ padding: '0.5rem', cursor: 'pointer', color: '#111', background: 'white' }}
                    onMouseDown={() => handleSuggestionClick(eleve.id, eleve.nom, eleve.prenom)}
                  >
                    {eleve.prenom} {eleve.nom.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="periode-select">Sélectionner une période:</label>
          <select 
            id="periode-select"
            value={selectedPeriode} 
            onChange={(e) => setSelectedPeriode(e.target.value)}
          >
            <option value="">-- Choisir une période --</option>
            {periodes.map(periode => (
              <option key={periode.id} value={periode.id}>
                {periode.nom} ({formatDateFromString(periode.dateDebut)} - {formatDateFromString(periode.dateFin)})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Format d'export:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
              />
              <span className="radio-label">PDF (Format officiel PFMP)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel')}
              />
              <span className="radio-label">Excel (Données détaillées)</span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleExport}
          disabled={!selectedEleve || !selectedPeriode}
          className="export-button"
        >
          Exporter en {exportFormat.toUpperCase()}
        </button>
      </div>

      {!selectedEleve || !selectedPeriode ? (
        <div className="info-message">
          Veuillez sélectionner un élève et une période pour activer l'export.
        </div>
      ) : (
        <div className="preview-info">
          <h3>Aperçu de l'export:</h3>
          <p>Élève: {eleves.find(e => e.id === selectedEleve)?.nom} {eleves.find(e => e.id === selectedEleve)?.prenom}</p>
          <p>Période: {periodes.find(p => p.id === selectedPeriode)?.nom}</p>
          <p>Format: {exportFormat === 'pdf' ? 'PDF - Format officiel PFMP' : 'Excel - Données détaillées'}</p>
          
          {(() => {
            const evaluation = evaluations.find(e => e.eleveId === selectedEleve && e.periodeId === selectedPeriode);
            if (!evaluation) {
              return <p className="no-evaluation">Aucune évaluation trouvée pour cette combinaison élève/période.</p>;
            }
            
            return (
              <div className="competences-preview">
                <h4>Tableau des compétences évaluées:</h4>
                
                {/* Légende */}
                <div className="legende">
                  <h5>Légende :</h5>
                  <div className="legende-items">
                    <div className="legende-item">
                      <div className="color-square" style={{ backgroundColor: getNiveauColor('non_evaluee') }}></div>
                      <span>Non évaluée</span>
                    </div>
                    <div className="legende-item">
                      <div className="color-square" style={{ backgroundColor: getNiveauColor('non_acquise') }}></div>
                      <span>Non acquise</span>
                    </div>
                    <div className="legende-item">
                      <div className="color-square" style={{ backgroundColor: getNiveauColor('en_cours') }}></div>
                      <span>En cours</span>
                    </div>
                    <div className="legende-item">
                      <div className="color-square" style={{ backgroundColor: getNiveauColor('partiellement_acquise') }}></div>
                      <span>Partiellement acquise</span>
                    </div>
                    <div className="legende-item">
                      <div className="color-square" style={{ backgroundColor: getNiveauColor('acquise') }}></div>
                      <span>Acquise</span>
                    </div>
                  </div>
                </div>

                {/* Tableau des compétences */}
                <table className="competences-table">
                  <thead>
                    <tr>
                      <th>Compétence</th>
                      <th>Sous-compétence</th>
                      <th>Niveau</th>
                      <th>Évaluation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* CC1 */}
                    <tr>
                      <td rowSpan={1}>CC1 - S'informer sur l'intervention</td>
                      <td>Collecter les données</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc1_collecter_donnees.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc1_collecter_donnees.niveau)}</td>
                    </tr>
                    
                    {/* CC2 */}
                    <tr>
                      <td rowSpan={2}>CC2 - Organiser la réalisation</td>
                      <td>Ordonner les données</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc2_ordonner_donnees.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc2_ordonner_donnees.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Repérer les contraintes</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc2_reperer_contraintes.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc2_reperer_contraintes.niveau)}</td>
                    </tr>
                    
                    {/* CC3 */}
                    <tr>
                      <td rowSpan={3}>CC3 - Analyser et exploiter les données</td>
                      <td>Identifier les éléments</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc3_identifier_elements.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc3_identifier_elements.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Identifier les grandeurs physiques</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc3_identifier_grandeurs.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc3_identifier_grandeurs.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Représenter l'installation</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc3_representer_installation.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc3_representer_installation.niveau)}</td>
                    </tr>
                    
                    {/* CC4 */}
                    <tr>
                      <td rowSpan={3}>CC4 - Réaliser une installation</td>
                      <td>Implanter, câbler</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc4_implanter_cabler.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc4_implanter_cabler.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Réaliser l'installation</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc4_realiser_installation.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc4_realiser_installation.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Opérer dans une attitude écoresponsable</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc4_operer_attitude.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc4_operer_attitude.niveau)}</td>
                    </tr>
                    
                    {/* CC7 */}
                    <tr>
                      <td rowSpan={3}>CC7 - Établir un pré-diagnostic (MAINTENANCE)</td>
                      <td>Contrôler les données</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc7_controler_donnees.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc7_controler_donnees.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Constater les défaillances</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc7_constater_defaillance.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc7_constater_defaillance.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Lister les hypothèses</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc7_lister_hypotheses.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc7_lister_hypotheses.niveau)}</td>
                    </tr>
                    
                    {/* CC8 */}
                    <tr>
                      <td rowSpan={3}>CC8 - Communiquer avec le client/usager</td>
                      <td>Compléter les documents</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc8_completer_documents.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc8_completer_documents.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Expliquer l'avancement</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc8_expliquer_avancement.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc8_expliquer_avancement.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Rédiger compte rendu</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc8_rediger_compte_rendu.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc8_rediger_compte_rendu.niveau)}</td>
                    </tr>
                    
                    {/* CC9 */}
                    <tr>
                      <td rowSpan={3}>CC9 - Relation client/usager</td>
                      <td>Interpréter les informations</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc9_interpreter_informations.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc9_interpreter_informations.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Expliquer le fonctionnement</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc9_expliquer_fonctionnement.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc9_expliquer_fonctionnement.niveau)}</td>
                    </tr>
                    <tr>
                      <td>Informer sur les consignes</td>
                      <td>
                        <div className="color-square" style={{ backgroundColor: getNiveauColor(evaluation.competences.cc9_informer_consignes.niveau) }}></div>
                      </td>
                      <td>{getNiveauText(evaluation.competences.cc9_informer_consignes.niveau)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ExportRapports;
