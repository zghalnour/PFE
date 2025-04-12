import { Component,OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-departements',
  templateUrl: './departements.component.html',
  styleUrl: './departements.component.css'
})
export class DepartementsComponent implements OnInit {
  departements :any[]= [];
  editingDeptId: number | null = null;
  

  
  currentDept: any = {};
  

  isEmployeDropdownOpen = false;

  selectedChef: any = null;
  selectedEmployes: any[] = [];
  employesAffectesDepartement: any[] = []; // Liste des employés sélectionnés
  constructor(
    private http: HttpClient,
  
  ) {}
  ngOnInit(): void {
    this.getDepartements();
    
  }
  isEditing(deptId: number): boolean {
    return this.editingDeptId === deptId;
  }
    // Basculer entre l'édition et la vue normale
    toggleEdit(deptId: number): void {
      if (this.isEditing(deptId)) {
        this.editingDeptId = null;
      } else {
        this.editingDeptId = deptId;
      }
    }
  
    // Enregistrer les modifications et appeler l'API
    saveChanges(dept: any): void {
      const updatedDept = {
        nom: dept.nom
      };
  
      // Appel API PUT pour mettre à jour le nom du département
      this.http.put(`http://localhost:5053/api/Departement/update/${dept.id}`, updatedDept, {
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }).subscribe(response => {
        // Manipuler la réponse du serveur
        console.log(response);
        // Réinitialiser l'état d'édition
        this.editingDeptId = null;
      }, error => {
        console.error('Erreur lors de la mise à jour du département:', error);
      });
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



  deleteDepartement(deptId: number): void {
    // Effectuer l'appel HTTP DELETE pour supprimer le département
    this.http.delete(`http://localhost:5053/api/Departement/delete/${deptId}`, {
      headers: { 'accept': '*/*' }
    }).subscribe(
      (response) => {
        console.log('Département supprimé avec succès', response);
        // Mettre à jour la liste des départements après la suppression
        this.departements = this.departements.filter(dept => dept.id !== deptId);
      },
      (error) => {
        console.error('Erreur lors de la suppression du département', error);
      }
    );
  }
}
