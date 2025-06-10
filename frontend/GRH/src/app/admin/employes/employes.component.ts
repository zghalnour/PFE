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

  role: string;
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
  departementNom: string | null;// L'API attend le nom final ici
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
    selectedRoleType: undefined as string | undefined, // For the role type select: 'GestionnaireRH' or 'Autre'
    customRole: '',
    role: '',
    salaire: 0,
    departementNom: null as string | null, 
    nouveauDepartementNom: '' 
  };
  departementError: string | null = null;
  formError: string | null = null; 
  passwordVisible: boolean = false;
  private queryParamsSubscription: Subscription | null = null; 
  employeForAccountDetails: any | null = null; // To store the employee whose account details are being viewed
  isAccountDetailsPanelVisible: boolean = false; // 
  isEditingAccountDetails: boolean = false;
  editableAccountDetails: any;
  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.fetchEmployes();
    this.fetchDepartements();
    this.checkQueryParamsForNewEmploye();
  }
  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }
 onRoleTypeChange(): void {
  if (this.employe.selectedRoleType === 'GestionnaireRH') {
    this.employe.customRole = ''; // Clear custom role if not 'Autre'
    // For a 'Gestionnaire RH', department is not applicable, so clear it.
    this.employe.departementNom = null;
    this.employe.nouveauDepartementNom = '';
  }
  // If 'Autre' is selected, the customRole input and department section will become visible.
  // The user will fill them.
}


  toggleEditAccountDetails(): void {
    this.isEditingAccountDetails = !this.isEditingAccountDetails;
    if (this.isEditingAccountDetails && this.employeForAccountDetails) {
      // Créer une copie superficielle pour l'édition
      this.editableAccountDetails = { ...this.employeForAccountDetails };
    } else {
      // Optionnel: réinitialiser si on quitte le mode édition sans sauvegarder
      // this.editableAccountDetails = null;
    }
  }

  saveAccountDetails(): void {
    if (this.editableAccountDetails && this.employeForAccountDetails && this.employeForAccountDetails.id) {
      const userId = this.employeForAccountDetails.id;
      const apiUrl = `http://localhost:5053/api/Users/modifier/${userId}`;

      const payload = {
        email: this.editableAccountDetails.email,
        phoneNumber: this.editableAccountDetails.phoneNumber,
        etat: this.editableAccountDetails.etat
      };

      this.http.put<any>(apiUrl, payload).subscribe({
        next: (response) => {
          console.log('Account details updated successfully:', response);

          // Mettre à jour l'objet original avec les valeurs retournées par l'API (meilleure pratique)
          this.employeForAccountDetails.email = response.email;
          this.employeForAccountDetails.phoneNumber = response.phoneNumber;
          this.employeForAccountDetails.etat = response.etat;

          // Mettre à jour également dans la liste principale des employés si nécessaire
          const indexInEmployes = this.employes.findIndex(emp => emp.id === userId);
          if (indexInEmployes !== -1) {
            this.employes[indexInEmployes].email = response.email;
            this.employes[indexInEmployes].phoneNumber = response.phoneNumber;
            // Si 'etat' est une propriété directe de l'objet Employe dans la liste, mettez-la aussi à jour.
            // this.employes[indexInEmployes].etat = response.etat;
          }
          const indexInFilteredEmployes = this.filteredEmployes.findIndex(emp => emp.id === userId);
          if (indexInFilteredEmployes !== -1) {
            this.filteredEmployes[indexInFilteredEmployes].email = response.email;
            this.filteredEmployes[indexInFilteredEmployes].phoneNumber = response.phoneNumber;
            // this.filteredEmployes[indexInFilteredEmployes].etat = response.etat;
          }


          this.isEditingAccountDetails = false; // Quitter le mode édition
          // Optionnel: Afficher un message de succès (par exemple, avec un service de notification/toaster)
          // alert('Détails du compte mis à jour avec succès !');
        },
        error: (error) => {
          console.error('Error updating account details:', error);
          // Optionnel: Afficher un message d'erreur à l'utilisateur
          // alert("Erreur lors de la mise à jour des détails du compte. Veuillez réessayer.");
          // Il est souvent préférable de laisser l'utilisateur en mode édition pour corriger
        }
      });
    } else {
      console.error('Editable account details or employee ID is missing.');
      // Gérer le cas où les données nécessaires ne sont pas disponibles
    }
  }


  cancelEditAccountDetails(): void {
    this.isEditingAccountDetails = false;
    // Pas besoin de restaurer `editableAccountDetails` car une nouvelle copie est faite à chaque entrée en mode édition.
  }

  // Assurez-vous de fermer le mode édition si le panneau est fermé
  closeAccountDetailsPanel(): void { // Si vous avez une méthode pour fermer le panneau
      this.isAccountDetailsPanelVisible = false;
      this.isEditingAccountDetails = false;
      this.employeForAccountDetails = null;
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
        this.employe.role = poste;
        this.employe.email = email;
        this.employe.phoneNumber = telephone; // Utilise la bonne propriété du modèle

        // Ouvre automatiquement le formulaire d'ajout
        this.isOpenForm = true;
           if (poste) {
    if (/rh/i.test(poste)) {
      this.employe.selectedRoleType = 'GestionnaireRH';
      this.employe.customRole = ''; // pas besoin de customRole ici
    } else {
      this.employe.selectedRoleType = 'Autre';
      this.employe.customRole = poste; // met la valeur exacte dans customRole
    }
  }



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
    this.postes = [...new Set(this.employes.map(employe => employe.role))];
  }

  filterEmployes() {
    this.filteredEmployes = this.employes.filter((employe) => {
      const nameMatch = employe.nomPrenom.toLowerCase().includes(this.searchTerm.toLowerCase());
      const departementMatch = this.selectedDepartement ? employe.departement === this.selectedDepartement : true;
      const posteMatch = this.selectedPoste ? employe.role === this.selectedPoste : true;
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
    this.isAccountDetailsPanelVisible = false;
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
    if (!this.currentEmploye || !this.currentEmploye.id) {
      console.error('Current employee data is missing or invalid.');
      // Optionally, show an error message to the user
      return;
    }

    let apiUrl: string;
    let updatePayload: any;
    const isRhRole = this.currentEmploye.role && this.currentEmploye.role.toLowerCase().includes('rh');

    if (isRhRole) {
      apiUrl = 'http://localhost:5053/api/Employe/updateRh';
      updatePayload = {
        rhId: this.currentEmploye.id,
        nomPrenom: this.currentEmploye.nomPrenom,
        salaire: this.currentEmploye.salaire,
      };
    } else {
      apiUrl = 'http://localhost:5053/api/Employe/updateEmByAdmin';
      const objectifsSmarts = (this.currentEmploye.objectifs || []).map(
        (objectif: any) => ({
          description: objectif.description,
          etat: objectif.atteint ?? false, // Ensure etat has a default if undefined
        })
      );
      updatePayload = {
        employeId: this.currentEmploye.id,
        nomPrenom: this.currentEmploye.nomPrenom, // Make sure nomPrenom is included for consistency if API expects it
        poste: this.currentEmploye.role,
        salaire: this.currentEmploye.salaire,
        departementNom: this.currentEmploye.departement,
        objectifsSmarts: objectifsSmarts,
      };
    }

    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })
      .then((response) => {
        if (!response.ok) {
          // Try to get more error details from the response body
          return response.text().then(text => {
            throw new Error(`Network response was not ok. Status: ${response.status}, Body: ${text}`);
          });
        }
        return response.text(); // Or response.json() if the API returns JSON on success
      })
      .then((data) => {
        console.log('Employee updated successfully:', data);
        
        // Update the local employes array more robustly
        const index = this.employes.findIndex(
          (e) => e.id === this.currentEmploye.id
        );
        if (index !== -1) {
          // Merge changes into the existing employee object to preserve other properties
          // and reflect what was actually sent to the backend.
          // For RH roles, only nomPrenom and salaire are updated from currentEmploye.
          // For other roles, more fields are updated.
          const updatedFields = isRhRole 
            ? { nomPrenom: this.currentEmploye.nomPrenom, salaire: this.currentEmploye.salaire }
            : { 
                nomPrenom: this.currentEmploye.nomPrenom,
                role: this.currentEmploye.role, 
                salaire: this.currentEmploye.salaire, 
                departement: this.currentEmploye.departement,
                objectifsSmarts: updatePayload.objectifsSmarts // Use the processed objectifs
              };
          this.employes[index] = { ...this.employes[index], ...updatedFields };

          // Also update in filteredEmployes if it exists there
          const filteredIndex = this.filteredEmployes.findIndex(
            (e) => e.id === this.currentEmploye.id
          );
          if (filteredIndex !== -1) {
            this.filteredEmployes[filteredIndex] = { ...this.filteredEmployes[filteredIndex], ...updatedFields };
          }
        }
        
        // Re-fetch all employees to ensure data consistency from the server
        this.fetchEmployes(); 
        // If not an RH role, and objectives were part of the update, re-fetch them
        if (!isRhRole && this.currentEmploye.objectifs) {
          this.fetchObjectifsSmart(this.currentEmploye.id);
        }
        this.cancelEdit(); // Close the edit form
      })
      .catch((error) => {
        console.error(
          'There has been a problem with your fetch operation:',
          error
        );
        // Optionally, display a user-friendly error message here
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
      selectedRoleType: undefined, // For the role type select: 'GestionnaireRH' or 'Autre'
      customRole: '',
      role: '',
      salaire: 0,
      departementNom: null, // Reset to null
      nouveauDepartementNom: '' // Reset the new property
    };
    this.passwordVisible = false; // Reset password visibility on form reset
  }
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
    openAccountDetails(employe: any): void {
    this.employeForAccountDetails = employe; // Store the selected employee
    this.isAccountDetailsPanelVisible = true; // Set flag to show the details panel

    // Optional: Close other panels to avoid UI clutter
    this.isFormVisible = false; 
    this.selectedEmploye = null; 
  }

  /**
   * Closes the account details panel.
   */


  submitEmploye() {
    let apiUrl: string;
    let dataToSend: any;
    let role=this.employe.role;
    if(role.toLowerCase().includes('rh')){
      this.employe.selectedRoleType='GestionnaireRH';
      this.employe.customRole=role;
    }
    else{
      this.employe.selectedRoleType='Autre';
      this.employe.customRole=role;
    }

    // Validate and set the final 'role' and determine API URL and payload
    if (this.employe.selectedRoleType === 'GestionnaireRH') {
      console.log('hiii')
      this.employe.role = 'Gestionnaire RH';
      apiUrl = 'http://localhost:5053/api/Employe/add-gestionnaire-rh';
      dataToSend = {
        nomPrenom: this.employe.nomPrenom,
        email: this.employe.email,
        phoneNumber: this.employe.phoneNumber,
        password: this.employe.password,
        poste: this.employe.role, // Will be "Gestionnaire RH"
        salaire: this.employe.salaire,
      };
      // Department is not applicable for GestionnaireRH with this endpoint
      this.employe.departementNom = null;
      this.employe.nouveauDepartementNom = '';

    } else if (this.employe.selectedRoleType === 'Autre') {
      console.log('bye')
      if (!this.employe.customRole || this.employe.customRole.trim() === '') {
        this.formError = "Veuillez préciser le poste.";
        return;
      }
      this.employe.role = this.employe.customRole.trim();

      if (!this.employe.departementNom) {
        this.formError = "Veuillez sélectionner un département pour ce poste.";
        return;
      }
      if (this.employe.departementNom === '--AUTRE--' && (!this.employe.nouveauDepartementNom || this.employe.nouveauDepartementNom.trim() === '')) {
        this.formError = "Veuillez préciser le nom du nouveau département.";
        return;
      }

      let finalDepartementNom: string | null = null;
      if (this.employe.departementNom === '--AUTRE--') {
        finalDepartementNom = this.employe.nouveauDepartementNom?.trim() || null;
      } else {
        finalDepartementNom = this.employe.departementNom;
      }

      apiUrl = 'http://localhost:5053/api/Employe/add';
      dataToSend = {
        nomPrenom: this.employe.nomPrenom,
        email: this.employe.email,
        password: this.employe.password,
        phoneNumber: this.employe.phoneNumber,
        poste: this.employe.role,
        salaire: this.employe.salaire,
        departementNom: finalDepartementNom
      } as CreerEmployePayload;
      console.log("pourquoiiii",dataToSend)

    } else {
      this.formError = "Veuillez sélectionner un type de poste.";
      return;
    }

    // Clear previous errors
    this.formError = null;
    this.departementError = null;

    
    console.log('Objet final à envoyer :', JSON.stringify(dataToSend, null, 2));

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post<any>(apiUrl, dataToSend, { headers })
      .subscribe({
        next: (response) => {
          console.log('Employé ajouté avec succès:', response);
          this.fetchEmployes();
          this.cancelForm();
        },
        error: (errorResponse) => {
          console.error('Erreur lors de l\'ajout de l\'employé:', errorResponse);
          if (errorResponse.status === 400 && errorResponse.error) {
            if (Array.isArray(errorResponse.error)) { // Standard ASP.NET Core validation errors
              const duplicateEmailError = errorResponse.error.find(
                (err: any) => err.code === 'DuplicateUserName' || err.code === 'DuplicateEmail' || (err.description && err.description.toLowerCase().includes('email') && (err.description.toLowerCase().includes('already taken') || err.description.toLowerCase().includes('existe déjà')))
              );
              if (duplicateEmailError) {
                this.formError = `Un compte employé avec l'adresse email "${this.employe.email}" existe déjà.`;
              } else {
                this.formError = errorResponse.error[0]?.description || "Erreur de validation. Veuillez vérifier les informations saisies.";
              }
            } else if (typeof errorResponse.error === 'string') { // Simple string error
                 if (errorResponse.error.toLowerCase().includes('email') && (errorResponse.error.toLowerCase().includes('already taken') || errorResponse.error.toLowerCase().includes('existe déjà'))) {
                    this.formError = `Un compte employé avec l'adresse email "${this.employe.email}" existe déjà.`;
                 } else {
                    this.formError = errorResponse.error;
                 }
            } else if (errorResponse.error.errors) { // Validation problem details
                const errorMessages = Object.values(errorResponse.error.errors).flat();
                this.formError = errorMessages.join(' ') || "Erreur de validation. Veuillez vérifier les informations saisies.";
            }
             else {
              this.formError = "Erreur de validation. Veuillez vérifier les informations saisies.";
            }
          } else {
            this.formError = "Une erreur inattendue est survenue lors de l'ajout de l'employé.";
          }
        }
      });
  }
   confirmDeleteEmploye(employe: any): void {
    if (!employe || !employe.id) {
      console.error('Informations de l\'employé manquantes pour la suppression.');
      // Optionnel: Afficher une erreur à l'utilisateur
      return;
    }

  
      const userId = employe.id;
      const apiUrl = `http://localhost:5053/api/Users/supprimer/${userId}`;

      this.http.delete(apiUrl).subscribe({
        next: () => {
          console.log(`Employé avec ID ${userId} supprimé avec succès.`);
          
          // Mettre à jour les listes locales après la suppression
          this.employes = this.employes.filter(emp => emp.id !== userId);
          this.filteredEmployes = this.filteredEmployes.filter(emp => emp.id !== userId);

          // Optionnel: Fermer les panneaux de détails si l'employé supprimé y était affiché
          if (this.selectedEmploye && this.selectedEmploye.id === userId) {
            this.selectedEmploye = null;
          }
          if (this.employeForAccountDetails && this.employeForAccountDetails.id === userId) {
            this.isAccountDetailsPanelVisible = false;
            this.employeForAccountDetails = null;
            this.isEditingAccountDetails = false;
          }
          
          // Optionnel: Afficher un message de succès (par exemple, avec un service de notification/toaster)
          // alert(`L'employé "${employe.nomPrenom}" a été supprimé.`);
        },
        error: (errorResponse) => {
          console.error(`Erreur lors de la suppression de l'employé avec ID ${userId}:`, errorResponse);
          // Optionnel: Afficher un message d'erreur à l'utilisateur
          // alert(`Une erreur est survenue lors de la suppression de l'employé "${employe.nomPrenom}".`);
        }
      });
    
  }


  cancelForm() {
    this.isOpenForm = false; 
    this.resetForm();
  }


  }
  
