import { Component,ViewChild, ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importe depuis @angular/common/http
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute et Router
import { Subscription } from 'rxjs';
interface Employe {
  id: number;
  nomPrenom: string;
  email: string;
  phoneNumber: string;
  poste: string;
  salaire: number;
  dateEmbauche: string;
  departement: string;
  projets: any[];
  demandesConge: any[];
  evaluationsRecues: any[];
  objectifsSmarts: any[];
  reclamations: Reclamation[];
  anciennete?: string;
}
interface Departement {
  nom: string;
  nomResponsable: string;
  employes: { id: number; nomPrenom: string }[];
  projets: any[];
}
interface ObjectifSmart {
  id: number;
  description: string;
  etat: boolean;
}
interface Reclamation {
  id: number;
  description: string;
  dateReclamation: string; // Keep it as string for now
}
interface CreerEmployePayload {
  nomPrenom: string;
  email: string;
  password: string;
  phoneNumber: string;
  poste: string;
  salaire: number;
  departementNom: string; // L'API attend le nom final ici
}
@Component({
  selector: 'app-employes',
  templateUrl: './employes.component.html',
  styleUrl: './employes.component.css'
})
export class EmployesComponent implements OnInit {
  
  employes: Employe[] = [];
  filteredEmployes: Employe[] = [];
  departements: string[] = [];
  postes: string[] = [];
  isFormVisible = false;
  currentEmploye: any = null;
  isAddingObjective = false;
  newObjective = '';
  isEditingObjective: boolean = false;
  editingObjectiveIndex: number = -1;
  editedDescription: string = '';
  isReclamationPanelVisible: boolean = false;
  selectedEmploye: Employe | null = null;
  searchTerm: string = '';
  selectedDepartement: string = '';
  selectedPoste: string = '';
  isOpenForm = false;
  employe = { 
    nomPrenom: '',
    email: '',
    password: '',
    phoneNumber: '',
    poste: '',
    salaire: 0,
    departementNom: null as string | null, 
    nouveauDepartementNom: '' 
  };
  departementError: string | null = null;
  formError: string | null = null; 
  passwordVisible: boolean = false;
  private queryParamsSubscription: Subscription | null = null; 

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.fetchEmployes();
    this.fetchDepartements();
    this.checkQueryParamsForNewEmploye();
  }
  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  checkQueryParamsForNewEmploye(): void {
    // S'abonne aux queryParams. Se désabonnera automatiquement si ngOnDestroy est implémenté
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      const nom = params['nom'];
      const email = params['email'];
      // Utilise la clé 'telephone' comme défini dans le queryParams du lien
      const telephone = params['telephone'];
      const poste= params['poste'];
      

      // Vérifie si les paramètres nécessaires sont présents
      if (nom && email && telephone && poste) {
        console.log('Query params reçus pour pré-remplissage:', { nom, email, telephone, poste });

        // Pré-remplit le modèle du formulaire
        this.employe.nomPrenom = nom;
        this.employe.poste = poste;
        this.employe.email = email;
        this.employe.phoneNumber = telephone; // Utilise la bonne propriété du modèle

        // Ouvre automatiquement le formulaire d'ajout
        this.isOpenForm = true;

        // Optionnel mais recommandé : Nettoie les queryParams de l'URL
        // pour éviter que le formulaire ne se pré-remplisse à nouveau
        // si l'utilisateur navigue ailleurs puis revient.
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {}, // Supprime tous les queryParams actuels
          replaceUrl: true // Remplace l'URL dans l'historique sans ajouter une nouvelle entrée
        });
      }
    });
  }
  onDepartementChange(selectedValue: string | null): void { 
    this.departementError = null;

    if (selectedValue !== '--AUTRE--') {
      
      this.employe.nouveauDepartementNom = '';
    }
  
  }

  
  fetchDepartements() {
    fetch('http://localhost:5053/api/Departement/getAllDepartements', {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: Departement[]) => {
        this.departements = data.map((departement) => departement.nom);
      })
      .catch((error) => {
        console.error(
          'There has been a problem with your fetch operation:',
          error
        );
      });
  }
  

  fetchEmployes() {
    fetch('http://localhost:5053/api/Employe/getAllEmployes', {
      method: 'GET',
      headers: {
        'accept': '*/*'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.employes = data.map((employe: any) => { // Use 'any' here temporarily
          const formattedReclamations = employe.reclamations.map((reclamation: any) => ({
            id: reclamation.id,
            description: reclamation.description,
            dateReclamation: this.formatDate(reclamation.dateReclamation) // Format the date
          }));
  
          return {
            ...employe, // Spread the rest of the employee data
            anciennete: this.calculateAnciennete(employe.dateEmbauche),
            reclamations: formattedReclamations // Assign the formatted reclamations
          } as Employe; // Cast to Employe interface
        });
        this.filteredEmployes = [...this.employes]; // Initialize filteredEmployes
        this.extractUniquePostes();
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  extractUniquePostes() {
    this.postes = [...new Set(this.employes.map(employe => employe.poste))];
  }

  filterEmployes() {
    this.filteredEmployes = this.employes.filter((employe) => {
      const nameMatch = employe.nomPrenom.toLowerCase().includes(this.searchTerm.toLowerCase());
      const departementMatch = this.selectedDepartement ? employe.departement === this.selectedDepartement : true;
      const posteMatch = this.selectedPoste ? employe.poste === this.selectedPoste : true;
      return nameMatch && departementMatch && posteMatch;
    });
  }
  fetchObjectifsSmart(employeId: number) {
    fetch(`http://localhost:5053/api/Employe/getObjectifsSmart/${employeId}`, {
      method: 'GET',
      headers: {
        accept: '*/*',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: ObjectifSmart[]) => {
        // Map the API response to the format expected by the UI
        this.currentEmploye.objectifs = data.map((objectif) => ({
          id: objectif.id,
          description: objectif.description,
          atteint: objectif.etat,
        }));
      })
      .catch((error) => {
        console.error(
          'There has been a problem with your fetch operation:',
          error
        );
      });
  }

  calculateAnciennete(dateEmbauche: string): string {
    const today = new Date();
    const embaucheDate = new Date(dateEmbauche);
  
    if (isNaN(embaucheDate.getTime())) {
      return "0"; // Return 0 if the date is invalid
    }
  
    let years = today.getFullYear() - embaucheDate.getFullYear();
    const monthDiff = today.getMonth() - embaucheDate.getMonth();
    const dayDiff = today.getDate() - embaucheDate.getDate();
  
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years--;
    }
  
    if (years === 0) {
      let months = today.getMonth() - embaucheDate.getMonth();
      if (dayDiff < 0) {
        months--;
      }
      if (months < 0) {
        months += 12;
      }
      if (months === 0) {
        return "0 ans"; // Return "0 ans" if both years and months are 0
      } else {
        return `${months} mois`;
      }
    } else {
      return `${years} ans`;
    }
  }
  

  // Méthode pour ouvrir le panneau des réclamations
  openReclamationPanel(employe: Employe) {
    this.selectedEmploye = employe; // Select the employee
    this.isReclamationPanelVisible = true; // Show the reclamations panel
    console.log("Selected Employee:", this.selectedEmploye); // Log the selected employee
    console.log("Reclamations:", this.selectedEmploye?.reclamations); // Log the reclamations
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
    if (this.currentEmploye && this.newObjective.trim() !== '') {
      if (!this.currentEmploye.objectifs) {
        this.currentEmploye.objectifs = [];
      }
      this.currentEmploye.objectifs.push({
        description: this.newObjective,
        atteint: false, // New objectives are initially "Non Atteint"
      });
      this.isAddingObjective = false;
      this.newObjective = '';
    }
  }

  // 🟢 Ouvre le formulaire de modification
  openEditForm(employe: any) {
    this.currentEmploye = { ...employe }; // Clone les données de l'employé
    if (!this.currentEmploye.objectifs) {
      this.currentEmploye.objectifs = [];
    }
    this.fetchObjectifsSmart(this.currentEmploye.id);
    this.isFormVisible = true;
    console.log("isFormVisible:", this.isFormVisible);
    console.log("currentEmploye:", this.currentEmploye);
    console.log("currentEmploye.objectifs:", this.currentEmploye.objectifs);
  }

  // 🟢 Ferme le formulaire
  cancelEdit() {
    this.isFormVisible = false;
    this.currentEmploye = null;
  }

  // 🟢 Sauvegarde les modifications
  saveChanges() {
    const objectifsSmarts = this.currentEmploye.objectifs.map(
      (objectif: any) => ({
        description: objectif.description,
        etat: objectif.atteint,
      })
    );

    const updateData = {
      employeId: this.currentEmploye.id,
      poste: this.currentEmploye.poste,
      salaire: this.currentEmploye.salaire,
      departementNom: this.currentEmploye.departement,
      objectifsSmarts: objectifsSmarts,
    };

    fetch('http://localhost:5053/api/Employe/updateEmByAdmin', {
      method: 'PUT',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text(); // Expecting text response
      })
      .then((data) => {
        console.log('Employee updated successfully:', data);
        // Update the local employes array
        const index = this.employes.findIndex(
          (e) => e.id === this.currentEmploye.id
        );
        if (index !== -1) {
          this.employes[index] = { ...this.currentEmploye };
          const filteredIndex = this.filteredEmployes.findIndex(
            (e) => e.id === this.currentEmploye.id
          );
          if (filteredIndex !== -1) {
            this.filteredEmployes[filteredIndex] = { ...this.currentEmploye };
          }
        }
        
        this.fetchEmployes();
        this.fetchObjectifsSmart(this.currentEmploye.id);
        this.cancelEdit();
      })
      .catch((error) => {
        console.error(
          'There has been a problem with your fetch operation:',
          error
        );
      });
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
  toggleForm() {
    this.isOpenForm = !this.isOpenForm;
    if (!this.isOpenForm) {
      this.resetForm(); // Reset form when closing
    }
  }
  resetForm(): void {
    this.employe = {
      nomPrenom: '',
      phoneNumber: '',
      email: '',
      password: '',
      poste: '',
      salaire: 0,
      departementNom: null, // Reset to null
      nouveauDepartementNom: '' // Reset the new property
    };
    this.passwordVisible = false; // Reset password visibility on form reset
  }
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
  submitEmploye() {
    this.departementError = null;
    
    let finalDepartementNom = this.employe.departementNom;
    if (this.employe.departementNom === '--AUTRE--') {
      // Si "Autre" est sélectionné, prendre la valeur de l'input
      finalDepartementNom = this.employe.nouveauDepartementNom?.trim() || null; // Utilise trim() et gère le cas où c'est vide
    } else {
      // Sinon, prendre la valeur du select (si elle n'est pas null)
      finalDepartementNom = this.employe.departementNom;
    }

    if (!finalDepartementNom) { // Vérifie si c'est null ou une chaîne vide après trim
      console.error('Nom de département invalide.');
      this.departementError = "Veuillez sélectionner ou saisir un nom de département valide.";
      return; // Arrête l'exécution si invalide
    }

    // Prepare the data payload according to the API specification
    const dataToSend : CreerEmployePayload = { 
      nomPrenom: this.employe.nomPrenom,
      email: this.employe.email,
      password: this.employe.password,
      phoneNumber: this.employe.phoneNumber,
      poste: this.employe.poste,
      salaire: this.employe.salaire,
      departementNom: finalDepartementNom // Use the determined department name
    };

    console.log('Envoi des données de l\'employé :', dataToSend);

  

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post<any>('http://localhost:5053/api/Employe/add', dataToSend, { headers })
      .subscribe({
        next: (response) => {
          console.log('Employé ajouté avec succès:', response);
          // Rafraîchir la liste, afficher succès, fermer formulaire...
          this.fetchEmployes(); // Exemple de rafraîchissement
          this.cancelForm();
        },
        error: (errorResponse) => { // Renommé en errorResponse pour clarté
          console.error('Erreur lors de l\'ajout de l\'employé:', errorResponse);

          // Vérifie si c'est une erreur 400 et si le corps de l'erreur existe
          if (errorResponse.status === 400 && errorResponse.error && Array.isArray(errorResponse.error)) {
            // Recherche une erreur spécifique d'email dupliqué (les codes peuvent varier)
            const duplicateEmailError = errorResponse.error.find(
              (err: any) => err.code === 'DuplicateUserName' || err.code === 'DuplicateEmail' || (err.description && err.description.toLowerCase().includes('email') && err.description.toLowerCase().includes('already taken'))
            );

            if (duplicateEmailError) {
              this.formError = `Un compte employé avec l'adresse email "${this.employe.email}" existe déjà.`;
            } else {
              // Affiche la première erreur de validation trouvée, ou un message générique
              this.formError = errorResponse.error[0]?.description || "Erreur de validation. Veuillez vérifier les informations saisies.";
            }
          } else {
            // Erreur réseau ou autre erreur serveur
            this.formError = "Une erreur inattendue est survenue lors de l'ajout de l'employé.";
          }
        }
      });
  }

  cancelForm() {
    this.isOpenForm = false; 
    this.resetForm();
  }


  }
  


