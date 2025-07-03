import React, { useState, useEffect } from 'react';
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

  const exportToPDF = () => {
    if (!selectedEleve || !selectedPeriode) return;

    const eleve = eleves.find(e => e.id === selectedEleve);
    const classe = classes.find(c => c.id === eleve?.classeId);
    const periode = periodes.find(p => p.id === selectedPeriode);
    const evaluation = evaluations.find(e => e.eleveId === selectedEleve && e.periodeId === selectedPeriode);

    if (!eleve || !periode) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // En-tête
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Document de suivi et d\'évaluation :', 15, yPosition);
    yPosition += 6;
    pdf.text('Situations de travail spécifiées et réalisées en milieu professionnel', 15, yPosition);
    yPosition += 15;

    // Titre PFMP
    pdf.setFontSize(16);
    const title = `PFMP N° ${periode.nom}`;
    pdf.text(title, (pageWidth - pdf.getTextWidth(title)) / 2, yPosition);
    yPosition += 10;

    // Dates
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const dateText = `Du ${formatDateFromString(periode.dateDebut)} au ${formatDateFromString(periode.dateFin)}`;
    pdf.text(dateText, pageWidth - 15 - pdf.getTextWidth(dateText), yPosition);
    yPosition += 15;

    // Candidat
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOM, PRÉNOM DU CANDIDAT', 15, yPosition);
    yPosition += 8;
    pdf.setFontSize(14);
    pdf.text(`${eleve.nom.toUpperCase()}–${eleve.prenom}`, 15, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.text(`Classe: ${classe?.nom || 'Non assignée'}`, 15, yPosition);
    yPosition += 15;

    // Compétences
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ÉVALUATION DES COMPÉTENCES ACQUISES EN PFMP :', 15, yPosition);
    yPosition += 10;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Critères d\'évaluation : 1-Non acquise, 2-En cours, 3-Partiellement acquise, 4-Acquise', 15, yPosition);
    yPosition += 5;

    // Légende des couleurs
    pdf.setFontSize(7);
    pdf.text('Légende :', 15, yPosition);
    yPosition += 3;
    
    // Carré gris (non évaluée)
    drawColoredSquare(pdf, 15, yPosition, 'non_evaluee');
    pdf.text('Non évaluée', 23, yPosition);
    
    // Carré rouge (non acquise)
    drawColoredSquare(pdf, 55, yPosition, 'non_acquise');
    pdf.text('Non acquise', 63, yPosition);
    
    // Carré orange (en cours)
    drawColoredSquare(pdf, 95, yPosition, 'en_cours');
    pdf.text('En cours', 103, yPosition);
    
    // Carré jaune (partiellement acquise)
    drawColoredSquare(pdf, 125, yPosition, 'partiellement_acquise');
    pdf.text('Partiellement acquise', 133, yPosition);
    
    // Carré vert (acquise)
    drawColoredSquare(pdf, 175, yPosition, 'acquise');
    pdf.text('Acquise', 183, yPosition);
    
    yPosition += 8;

    if (evaluation) {
      // CC1
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC1 - S\'informer sur l\'intervention', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // Dessiner le carré coloré et le texte pour CC1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc1_collecter_donnees.niveau);
      const cc1 = getNiveauSymbol(evaluation.competences.cc1_collecter_donnees.niveau);
      pdf.text(`Collecter les données [${cc1}]`, 28, yPosition);
      yPosition += 8;

      // CC2
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC2 - Organiser la réalisation', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC2.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc2_ordonner_donnees.niveau);
      const cc2_1 = getNiveauSymbol(evaluation.competences.cc2_ordonner_donnees.niveau);
      pdf.text(`Ordonner les données [${cc2_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC2.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc2_reperer_contraintes.niveau);
      const cc2_2 = getNiveauSymbol(evaluation.competences.cc2_reperer_contraintes.niveau);
      pdf.text(`Repérer les contraintes [${cc2_2}]`, 28, yPosition);
      yPosition += 8;

      // CC3
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC3 - Analyser et exploiter les données', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC3.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc3_identifier_elements.niveau);
      const cc3_1 = getNiveauSymbol(evaluation.competences.cc3_identifier_elements.niveau);
      pdf.text(`Identifier les éléments [${cc3_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC3.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc3_identifier_grandeurs.niveau);
      const cc3_2 = getNiveauSymbol(evaluation.competences.cc3_identifier_grandeurs.niveau);
      pdf.text(`Identifier les grandeurs physiques [${cc3_2}]`, 28, yPosition);
      yPosition += 4;
      
      // CC3.3
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc3_representer_installation.niveau);
      const cc3_3 = getNiveauSymbol(evaluation.competences.cc3_representer_installation.niveau);
      pdf.text(`Représenter l'installation [${cc3_3}]`, 28, yPosition);
      yPosition += 8;

      // CC4
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC4 - Réaliser une installation', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC4.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc4_implanter_cabler.niveau);
      const cc4_1 = getNiveauSymbol(evaluation.competences.cc4_implanter_cabler.niveau);
      pdf.text(`Implanter, câbler [${cc4_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC4.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc4_realiser_installation.niveau);
      const cc4_2 = getNiveauSymbol(evaluation.competences.cc4_realiser_installation.niveau);
      pdf.text(`Réaliser l'installation [${cc4_2}]`, 28, yPosition);
      yPosition += 4;
      
      // CC4.3
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc4_operer_attitude.niveau);
      const cc4_3 = getNiveauSymbol(evaluation.competences.cc4_operer_attitude.niveau);
      pdf.text(`Opérer dans une attitude écoresponsable [${cc4_3}]`, 28, yPosition);
      yPosition += 8;

      // CC7
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC7 - Établir un pré-diagnostic (MAINTENANCE)', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC7.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc7_controler_donnees.niveau);
      const cc7_1 = getNiveauSymbol(evaluation.competences.cc7_controler_donnees.niveau);
      pdf.text(`Contrôler les données [${cc7_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC7.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc7_constater_defaillance.niveau);
      const cc7_2 = getNiveauSymbol(evaluation.competences.cc7_constater_defaillance.niveau);
      pdf.text(`Constater les défaillances [${cc7_2}]`, 28, yPosition);
      yPosition += 4;
      
      // CC7.3
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc7_lister_hypotheses.niveau);
      const cc7_3 = getNiveauSymbol(evaluation.competences.cc7_lister_hypotheses.niveau);
      pdf.text(`Lister les hypothèses [${cc7_3}]`, 28, yPosition);
      yPosition += 8;

      // CC8
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC8 - Renseigner les documents (COMMUNICATION)', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC8.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc8_completer_documents.niveau);
      const cc8_1 = getNiveauSymbol(evaluation.competences.cc8_completer_documents.niveau);
      pdf.text(`Compléter les documents [${cc8_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC8.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc8_expliquer_avancement.niveau);
      const cc8_2 = getNiveauSymbol(evaluation.competences.cc8_expliquer_avancement.niveau);
      pdf.text(`Expliquer l'avancement [${cc8_2}]`, 28, yPosition);
      yPosition += 4;
      
      // CC8.3
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc8_rediger_compte_rendu.niveau);
      const cc8_3 = getNiveauSymbol(evaluation.competences.cc8_rediger_compte_rendu.niveau);
      pdf.text(`Rédiger un compte rendu [${cc8_3}]`, 28, yPosition);
      yPosition += 8;

      // CC9
      pdf.setFont('helvetica', 'bold');
      pdf.text('CC9 - Communiquer avec le client et/ou l\'usager', 15, yPosition);
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
      
      // CC9.1
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc9_interpreter_informations.niveau);
      const cc9_1 = getNiveauSymbol(evaluation.competences.cc9_interpreter_informations.niveau);
      pdf.text(`Interpréter les informations [${cc9_1}]`, 28, yPosition);
      yPosition += 4;
      
      // CC9.2
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc9_expliquer_fonctionnement.niveau);
      const cc9_2 = getNiveauSymbol(evaluation.competences.cc9_expliquer_fonctionnement.niveau);
      pdf.text(`Expliquer le fonctionnement [${cc9_2}]`, 28, yPosition);
      yPosition += 4;
      
      // CC9.3
      drawColoredSquare(pdf, 20, yPosition, evaluation.competences.cc9_informer_consignes.niveau);
      const cc9_3 = getNiveauSymbol(evaluation.competences.cc9_informer_consignes.niveau);
      pdf.text(`Informer sur les consignes [${cc9_3}]`, 28, yPosition);
      yPosition += 12;

      // Commentaires
      if (evaluation.commentaireGeneral || evaluation.recommandations) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('OBSERVATIONS :', 15, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        if (evaluation.commentaireGeneral) {
          const commentaireLines = pdf.splitTextToSize(evaluation.commentaireGeneral, pageWidth - 30);
          pdf.text(commentaireLines, 15, yPosition);
          yPosition += commentaireLines.length * 5 + 5;
        }
        
        if (evaluation.recommandations) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('RECOMMANDATIONS :', 15, yPosition);
          yPosition += 5;
          pdf.setFont('helvetica', 'normal');
          const recommandationLines = pdf.splitTextToSize(evaluation.recommandations, pageWidth - 30);
          pdf.text(recommandationLines, 15, yPosition);
        }
      }
    }

    // Signature
    yPosition = pdf.internal.pageSize.height - 40;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Date et signature du tuteur en entreprise:', 15, yPosition);
    yPosition += 20;
    pdf.text('Date et signature de l\'enseignant:', pageWidth - 100, yPosition - 20);

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
    data.push(['Compétence', 'Sous-compétence', 'Niveau', 'Commentaire']);

    if (evaluation) {
      const competences = evaluation.competences;
      
      data.push(['CC1 - S\'informer', 'Collecter les données', getNiveauSymbol(competences.cc1_collecter_donnees.niveau), competences.cc1_collecter_donnees.commentaire]);
      
      data.push(['CC2 - Organiser', 'Ordonner les données', getNiveauSymbol(competences.cc2_ordonner_donnees.niveau), competences.cc2_ordonner_donnees.commentaire]);
      data.push(['', 'Repérer les contraintes', getNiveauSymbol(competences.cc2_reperer_contraintes.niveau), competences.cc2_reperer_contraintes.commentaire]);
      
      data.push(['CC3 - Analyser', 'Identifier les éléments', getNiveauSymbol(competences.cc3_identifier_elements.niveau), competences.cc3_identifier_elements.commentaire]);
      data.push(['', 'Identifier les grandeurs', getNiveauSymbol(competences.cc3_identifier_grandeurs.niveau), competences.cc3_identifier_grandeurs.commentaire]);
      data.push(['', 'Représenter l\'installation', getNiveauSymbol(competences.cc3_representer_installation.niveau), competences.cc3_representer_installation.commentaire]);
      
      data.push(['CC4 - Réaliser', 'Implanter, câbler', getNiveauSymbol(competences.cc4_implanter_cabler.niveau), competences.cc4_implanter_cabler.commentaire]);
      data.push(['', 'Réaliser l\'installation', getNiveauSymbol(competences.cc4_realiser_installation.niveau), competences.cc4_realiser_installation.commentaire]);
      data.push(['', 'Attitude écoresponsable', getNiveauSymbol(competences.cc4_operer_attitude.niveau), competences.cc4_operer_attitude.commentaire]);
      
      data.push(['CC7 - Maintenance', 'Contrôler les données', getNiveauSymbol(competences.cc7_controler_donnees.niveau), competences.cc7_controler_donnees.commentaire]);
      data.push(['', 'Constater les défaillances', getNiveauSymbol(competences.cc7_constater_defaillance.niveau), competences.cc7_constater_defaillance.commentaire]);
      data.push(['', 'Lister les hypothèses', getNiveauSymbol(competences.cc7_lister_hypotheses.niveau), competences.cc7_lister_hypotheses.commentaire]);
      
      data.push(['CC8 - Communication', 'Compléter les documents', getNiveauSymbol(competences.cc8_completer_documents.niveau), competences.cc8_completer_documents.commentaire]);
      data.push(['', 'Expliquer l\'avancement', getNiveauSymbol(competences.cc8_expliquer_avancement.niveau), competences.cc8_expliquer_avancement.commentaire]);
      data.push(['', 'Rédiger compte rendu', getNiveauSymbol(competences.cc8_rediger_compte_rendu.niveau), competences.cc8_rediger_compte_rendu.commentaire]);
      
      data.push(['CC9 - Client/Usager', 'Interpréter les informations', getNiveauSymbol(competences.cc9_interpreter_informations.niveau), competences.cc9_interpreter_informations.commentaire]);
      data.push(['', 'Expliquer le fonctionnement', getNiveauSymbol(competences.cc9_expliquer_fonctionnement.niveau), competences.cc9_expliquer_fonctionnement.commentaire]);
      data.push(['', 'Informer sur les consignes', getNiveauSymbol(competences.cc9_informer_consignes.niveau), competences.cc9_informer_consignes.commentaire]);
      
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

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="export-rapports">
      <h2>Export des rapports PFMP</h2>
      
      <div className="export-form">
        <div className="form-group">
          <label htmlFor="eleve-select">Sélectionner un élève:</label>
          <select 
            id="eleve-select"
            value={selectedEleve} 
            onChange={(e) => setSelectedEleve(e.target.value)}
          >
            <option value="">-- Choisir un élève --</option>
            {eleves.map(eleve => (
              <option key={eleve.id} value={eleve.id}>
                {eleve.nom} {eleve.prenom}
              </option>
            ))}
          </select>
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
