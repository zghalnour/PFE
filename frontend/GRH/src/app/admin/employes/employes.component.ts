import { Component,ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-employes',
  templateUrl: './employes.component.html',
  styleUrl: './employes.component.css'
})
export class EmployesComponent {
  
  employes = [
    { 
      id: 1, 
      nomPrenom: "Ahmed Zghal", 
      departement: "IT", 
      salaire: 3500, 
      anciennete: 5, 
      objectifs: [
        { description: "Obtenir la certification en Développement Web d'ici le 31 décembre 2025.", atteint: true },
        { description: "Améliorer les compétences en JavaScript avec un projet personnel d'ici le 30 juin 2025.", atteint:true }
      ] ,
      reclamations: [
        { date: '2025-01-01', details: 'Réclamation 1' },
        { date: '2025-02-15', details: 'Réclamation 2' }
      ]
    },
    { 
      id: 2, 
      nomPrenom: "Nour Zghal", 
      departement: "RH", 
      salaire: 3200, 
      anciennete: 3, 
      objectifs: [
        { description: "Terminer un cours avancé sur React et créer une application de gestion de tâches d'ici le 31 mai 2025.", atteint: true },
        { description: "Maîtriser l'intégration continue (CI) et le déploiement continu (CD) d'ici le 30 septembre 2025.", atteint: false }
      ],
      reclamations: [
        { date: '2025-01-01', details: 'Réclamation 1' },
        { date: '2025-02-15', details: 'Réclamation 2' }
      ]
    },
    { 
      id: 2, 
      nomPrenom: "Ons Turki", 
      departement: "RH", 
      salaire: 3200, 
      anciennete: 3, 
      objectifs: [
        { description: "Terminer un cours avancé sur React et créer une application de gestion de tâches d'ici le 31 mai 2025.", atteint: true },
        { description: "Maîtriser l'intégration continue (CI) et le déploiement continu (CD) d'ici le 30 septembre 2025.", atteint: false }
      ],
      reclamations: [
        { date: '2025-01-01', details: 'Réclamation 1' },
        { date: '2025-02-15', details: 'Réclamation 2' }
      ]
    }
  
  ];
  

  isFormVisible = false;
  currentEmploye: any = null;
  isAddingObjective = false;
  newObjective = '';
  isEditingObjective: boolean = false;
  editingObjectiveIndex: number = -1;
  editedDescription: string = '';
  isReclamationPanelVisible: boolean = false;
  selectedEmploye: any = null;

  // Méthode pour ouvrir le panneau des réclamations
  openReclamationPanel(employe: any): void {
    this.selectedEmploye = employe;  // Sélectionner l'employé
    this.isReclamationPanelVisible = true;  // Afficher le panneau des réclamations
  }

  // Méthode pour fermer le panneau des réclamations
  closeReclamationPanel(): void {
    this.isReclamationPanelVisible = false;  // Cacher le panneau des réclamations
  }

  editObjective(index: number) {
    this.isEditingObjective = true; // Activer l'édition
    this.editingObjectiveIndex = index; // Enregistrer l'index de l'objectif à éditer
    this.editedDescription = this.currentEmploye.objectifs[index].description; // Charger la description dans le champ de texte
  }

  // Fonction pour sauvegarder les modifications de l'objectif
  saveEditedObjective() {
    if (this.editingObjectiveIndex >= 0) {
      this.currentEmploye.objectifs[this.editingObjectiveIndex].description = this.editedDescription; // Sauvegarder la nouvelle description
      this.isEditingObjective = false; // Désactiver l'édition
      this.editingObjectiveIndex = -1; // Réinitialiser l'index
    }
  }

  // Fonction pour annuler l'édition
  cancelEditO() {
    this.isEditingObjective = false;
    this.editingObjectiveIndex = -1;
  }
  toggleAddObjective() {
    this.isAddingObjective = !this.isAddingObjective;
    this.newObjective = ''; // Réinitialiser l'input
  }
  
  addObjective() {
    if (this.newObjective.trim() !== '') {
      this.currentEmploye.objectifs.push({ description: this.newObjective, progress: 0 });
      this.isAddingObjective = false; // Cacher le champ après l'ajout
      this.newObjective = ''; // Réinitialiser l'input
    }
  }

  // 🟢 Ouvre le formulaire de modification
  openEditForm(employe: any) {
    this.currentEmploye = { ...employe }; // Clone les données de l'employé
    this.isFormVisible = true;
  }

  // 🟢 Ferme le formulaire
  cancelEdit() {
    this.isFormVisible = false;
    this.currentEmploye = null;
  }

  // 🟢 Sauvegarde les modifications
  saveChanges() {
    const index = this.employes.findIndex(e => e.id === this.currentEmploye.id);
    if (index !== -1) {
      this.employes[index] = { ...this.currentEmploye };
    }
    this.cancelEdit();
  }

  // 🟢 Ajoute un nouvel objectif
  ajouterObjectif() {
    if (this.currentEmploye && this.currentEmploye.objectifs) {
      this.currentEmploye.objectifs.push("Nouvel objectif");
    }
  }
  deleteObjective(index: number) {
    this.currentEmploye.objectifs.splice(index, 1);
  }
  
}
