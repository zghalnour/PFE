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
  

  showAddDepartmentInput: boolean = false; // Pour contrôler la visibilité du champ d'ajout
  newDepartmentName: string = '';

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

  toggleAddDepartmentInput(): void {
    this.showAddDepartmentInput = !this.showAddDepartmentInput;
    if (!this.showAddDepartmentInput) {
      this.newDepartmentName = ''; // Réinitialiser si on annule l'affichage
    }
  }

  cancelAddDepartment(): void {
    this.newDepartmentName = '';
    this.showAddDepartmentInput = false;
  }

 addNewDepartment(): void {
    const departmentName = this.newDepartmentName.trim();
    if (!departmentName) {
      alert('Le nom du département ne peut pas être vide.');
      return;
    }

    const newDepartmentPayload = { nom: departmentName };
    const apiUrl = 'http://localhost:5053/api/Departement/add';

    this.http.post<any>(apiUrl, newDepartmentPayload)
      .subscribe({
        next: (response) => {
          // La réponse de l'API est :
          // {
          //   "message": "Département ajouté avec succès.",
          //   "departementId": 5,
          //   "nom": "test",
          //   "nomResponsable": "Aucun"
          // }

          // Créer un nouvel objet département basé sur la réponse de l'API
          // et la structure attendue par votre template
          const newDept = {
            id: response.departementId,
            nom: response.nom,
            nomResponsable: response.nomResponsable,
            employes: [], // Initialiser avec une liste vide d'employés
            projets: []   // Initialiser avec une liste vide de projets
          };

          this.departements.push(newDept); // Ajouter le nouveau département à la liste
          this.newDepartmentName = ''; // Réinitialiser le champ de saisie
          this.showAddDepartmentInput = false; // Cacher le formulaire d'ajout

          console.log('Département ajouté avec succès via API:', response);
          // Optionnel: Afficher un message de succès à l'utilisateur, par exemple avec un toastr ou une alerte.
          // alert(response.message);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du département via API:', error);
          // Gérer les erreurs de manière plus conviviale pour l'utilisateur
          let errorMessage = 'Erreur lors de l\'ajout du département. Veuillez réessayer.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = `Erreur: ${error.error}`;
          } else if (error.error && error.error.message) {
            errorMessage = `Erreur: ${error.error.message}`;
          } else if (error.message) {
            errorMessage = `Erreur: ${error.message}`;
          }
          alert(errorMessage);
        }
      });
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
