import { Component,OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-departements',
  templateUrl: './departements.component.html',
  styleUrl: './departements.component.css'
})
export class DepartementsComponent implements OnInit {
  departements :any[]= [];
  responsables: any[] = [];
  employes: any[] = [];
  

  isFormVisible = false;
  currentDept: any = {};
  isEditing = false;

  isEmployeDropdownOpen = false;

  selectedChef: any = null;
  selectedEmployes: any[] = [];
  employesAffectesDepartement: any[] = []; // Liste des employés sélectionnés
  constructor(
    private http: HttpClient,
  
  ) {}
  ngOnInit(): void {
    this.getDepartements();
    this.getResponsables();
    this.getEmployes();
  }

  getDepartements(): void {
    this.http.get<any[]>('http://localhost:5053/api/Departement/getAllDepartements')
      .subscribe(
        (data) => {
          this.departements = data;
        },
        (error) => {
          console.error('Erreur lors de la récupération des départements', error);
        }
      );
  }
  getResponsables(): void {
    this.http.get<any[]>('http://localhost:5053/api/Responsable/getAll')
      .subscribe(
        (data) => {
          this.responsables = data;
        },
        (error) => {
          console.error('Erreur lors de la récupération des responsables', error);
        }
      );
  }
  getEmployes(): void {
    this.http.get<any[]>('http://localhost:5053/api/Employe/getNomEmployes')
      .subscribe(
        (data) => {
          this.employes = data;
        },
        (error) => {
          console.error('Erreur lors de la récupération des employés', error);
        }
      );
  }

  toggleDropdown(type: string) {
    if (type === 'employe') {
      this.isEmployeDropdownOpen = !this.isEmployeDropdownOpen;
    }
  }

  selectChef(user: any) {
    this.selectedChef = user;
  
    this.currentDept.responsableId = user.id;
  }
  getEmployesAffectesDepartement(nomDepartement: string) {
    const departement = this.departements.find(d => d.nom === nomDepartement);
    if (departement) {
      this.employesAffectesDepartement = departement.employes;
    }
  }
  
  // Vérifier si un employé est déjà affecté à un département
  isEmployeSelected(employe: any): boolean {
    return this.employesAffectesDepartement.some(e => e.id === employe.id);
  }

  selectEmploye(employe: any) {
    if (!this.isEmployeSelected(employe)) {
      this.selectedEmployes.push(employe); // Ajouter à la liste des employés sélectionnés
    }
  }
  // Supprime un employé de la liste des sélectionnés
  removeEmploye(index: number) {
    this.selectedEmployes.splice(index, 1);
  }

  openEditForm(dept: any) {
    this.isFormVisible = true;
    this.currentDept = { ...dept };
    this.getEmployesAffectesDepartement(dept.nom);
  
    // Trouver le responsable actuel du département
    this.selectedChef = this.responsables.find(r => r.nomPrenom === dept.nomResponsable) || null;
    this.currentDept.responsableId = this.selectedChef ? this.selectedChef.id : null;
  }
  
  

  saveChanges() {
    // Logique pour enregistrer les modifications
    console.log('Données enregistrées', this.currentDept);
    this.isFormVisible = false;
  }

  cancelEdit() {
    this.isFormVisible = false;
  }

  deleteDepartement(deptId: number) {
    // Logique pour supprimer le département
    console.log('Département supprimé', deptId);
  }
}
