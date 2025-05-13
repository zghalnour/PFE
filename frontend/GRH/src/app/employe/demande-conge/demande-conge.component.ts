import { Component, OnInit, ViewChild, AfterViewInit,TemplateRef } from '@angular/core';
import { MatDialog,MatDialogRef } from '@angular/material/dialog';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http'; // Pour les appels API réels

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker'; // Ajoutez MatDatepickerInputEvent

export interface DemandeConge {
  id: number;
  dateDemande: string;  
  dateDebut: string;
  dateFin: string;
  raison?: string;
  type: string; 
  statut: 'En Attente' | 'Approuvée' | 'Refusée';
  
  
}
interface TypeConge {
  value: string;
  
}
@Component({
  selector: 'app-demande-conge',
  templateUrl: './demande-conge.component.html',
  styleUrl: './demande-conge.component.css'
})
export class DemandeCongeComponent implements OnInit, AfterViewInit {
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  confirmationMessage = '';
  displayedColumns: string[] = ['type', 'dateDebut', 'dateFin', 'raison','nbJours', 'statut', 'dateDemande', 'actions'];

  listeDemandes: DemandeConge[] = [];
  selectedStatut: string = '';
originalDemandes: any[] = [];
  isLoading = true;
  errorLoading = false;
  employeId:number=0;
   apiBaseUrl = 'http://localhost:5053/api/DemCong';
   statusOptions: string[] = ['Tous', 'En Attente', 'Approuvée', 'Refusée']; // Options pour le filtre
  selectedStatusFilter: string = 'Tous'; // Filtre sélectionné par défaut


  @ViewChild('demandeCongeDialogTemplate') demandeCongeDialogTemplate!: TemplateRef<any>;
  demandeForm: FormGroup;
  typesConge: TypeConge[] = [
    { value: 'CongeAnnuel' },
    { value:'CongeMaladie' },
    { value:'CongeSansSolde' },
    { value: 'CongeMaternite'},
    { value: 'CongePaternite'},
  ];
  minDateFin: Date | null = null;
  private currentDialogRef: MatDialogRef<any> | null = null; // Pour garder une référ
  constructor(
    public dialog: MatDialog,
    private http: HttpClient ,
    private fb: FormBuilder
    ) {
      this.demandeForm = this.fb.group({
        typeConge: ['', Validators.required],
        dateDebut: [null, Validators.required],
        dateFin: [null, Validators.required],
        motif: ['']
      });
    }
    
  ngOnInit(): void {
    this.loadUserData();
    this.loadDemandesConge();
  
    this.demandeForm.get('dateDebut')?.valueChanges.subscribe((dateDebut: Date | null) => {
      if (dateDebut) {
        this.minDateFin = new Date(dateDebut);
        // this.minDateFin.setDate(this.minDateFin.getDate()); // La date de fin peut être le même jour

        const dateFinControl = this.demandeForm.get('dateFin');
        if (dateFinControl?.value && dateFinControl.value < this.minDateFin) {
          dateFinControl.setValue(null);
        }
      } else {
        this.minDateFin = null;
      }
      
    });
  }
  loadUserData(): void {
  
    const storedUserId = localStorage.getItem('userId');
  
  
    if (storedUserId) {
      this.employeId = parseInt(storedUserId, 10); 
    }
  
  
  }
  ngAfterViewInit(): void {

  }
  cancelDemande(demande: DemandeConge): void {
    this.confirmationMessage = `Êtes-vous sûr de vouloir annuler cette demande de congé du ${new Date(demande.dateDebut).toLocaleDateString()} au ${new Date(demande.dateFin).toLocaleDateString()} ?`;

    const dialogRef = this.dialog.open(this.confirmDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true;
        this.http.delete(`http://localhost:5053/api/DemCong/Supprimer/${demande.id}`).subscribe({
          next: () => {
            this.listeDemandes = this.listeDemandes.filter(d => d.id !== demande.id);
            this.isLoading = false;
            console.log('Demande annulée');
          },
          error: err => {
            this.isLoading = false;
            console.error('Erreur annulation', err);
          }
        });
      }
    });
  }

  loadDemandesConge(): void {
    if (!this.employeId) {
      console.error("Cannot load leave requests without Employee ID.");
      this.isLoading = false;
      this.errorLoading = true;
      return;
    }
  
    this.isLoading = true;
    this.errorLoading = false;
    const apiUrl = `${this.apiBaseUrl}/GetByEmployeId/${this.employeId}`;
  
    this.http.get<DemandeConge[]>(apiUrl).subscribe({
      next: (apiData) => {
        // Ici tu utilises ta liste normale, par exemple : this.listeDemandes
        this.listeDemandes = apiData.map(apiDemande => ({
          id: apiDemande.id,
          type: apiDemande.type,
          dateDebut: apiDemande.dateDebut,
          dateFin: apiDemande.dateFin,
          dateDemande: apiDemande.dateDemande,
          raison: apiDemande.raison,
          statut: apiDemande.statut
        })).sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());
  
        this.isLoading = false;
        this.originalDemandes = this.listeDemandes; 
        console.log('Demandes de congé chargées:', this.listeDemandes);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes de congé:', error);
        this.isLoading = false;
        this.errorLoading = true;
      }
      
    });
  }
  
  
   // Helper to map API status strings to internal enum/string if necessary
   mapApiStatut(apiStatut: string): 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE' | string {
      const lowerCaseStatut = apiStatut.toLowerCase();
      if (lowerCaseStatut.includes('attente')) return 'EN_ATTENTE';
      if (lowerCaseStatut.includes('approuv')) return 'APPROUVEE'; // Handle variations like 'Approuvée'
      if (lowerCaseStatut.includes('refus')) return 'REFUSEE';   // Handle variations like 'Refusée'
      return apiStatut; // Return original if no match (should ideally not happen)
   }
   applyStatutFilter() {
    if (this.selectedStatut) {
      this.listeDemandes = this.originalDemandes.filter(demande => demande.statut === this.selectedStatut);
    } else {
      this.listeDemandes = [...this.originalDemandes];
    }}
    onDateDebutChange(event: any) {
      const selectedDate = event.value;
      if (selectedDate) {
        selectedDate.setHours(12, 0, 0, 0); // Fixer à midi pour éviter décalage UTC
        this.demandeForm.get('dateDebut')?.setValue(selectedDate);
        this.minDateFin = selectedDate; // Mise à jour de la date minimale pour la fin
      }
    }
    onDateFinChange(event: any) {
      const selectedDate = event.value;
      if (selectedDate) {
        selectedDate.setHours(12, 0, 0, 0); // Fixe l'heure à midi
        this.demandeForm.get('dateFin')?.setValue(selectedDate);
      }
    }
    
    
  calculerNbJours(dateDebut: Date, dateFin: Date): number {
    if (!dateDebut || !dateFin) {
      return 0;
    }
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diff = fin.getTime() - debut.getTime();
    const diffInDays = diff / (1000 * 3600 * 24) + 1; // +1 pour inclure la date de début
    return diffInDays;
  }
  
  // --- onSubmit: prepares data and calls submitNewDemande ---
  onSubmit(): void {
    if (this.demandeForm.invalid) {
      this.demandeForm.markAllAsTouched();
    
      return;
    }

    const formData = this.demandeForm.value;

    // Prepare data for the API (match backend model for POST /ajouter/{id})
    const apiRequestData = {
      // employeId is now part of the URL, not the body
      dateDebut: this.formatDateForApi(formData.dateDebut), // Format date correctly
      dateFin: this.formatDateForApi(formData.dateFin),     // Format date correctly
      raison: formData.motif,   // 'raison' field in API
      type: formData.typeConge, // 'type' field in API
    };

    console.log('Nouvelle demande à soumettre (API format):', apiRequestData);
    this.submitNewDemande(apiRequestData); // Pass API-ready data
    this.currentDialogRef?.close();
  }

  // --- formatDateForApi helper remains the same ---
  formatDateForApi(date: Date | null): string | null {
      if (!date) return null;
      // Ensure ISO 8601 format as shown in the curl example
      return date.toISOString();
  }


  onCancel(): void {
    this.currentDialogRef?.close(); // Fermer la modale
  }
  openDemandeCongeModal(): void {
    this.demandeForm.reset(); // Réinitialiser le formulaire avant d'ouvrir
    this.minDateFin = null; // Réinitialiser la date min

    this.currentDialogRef = this.dialog.open(this.demandeCongeDialogTemplate, { // Utilisez la référence du template
      width: '600px',
      disableClose: true, // Empêche la fermeture en cliquant à l'extérieur
    });

    // Gérer la fermeture (optionnel)
    this.currentDialogRef.afterClosed().subscribe(result => {
      console.log('La modale a été fermée');
      this.currentDialogRef = null; // Nettoyer la référence
      // Pas besoin de traiter 'result' ici car la soumission se fait via onSubmit()
    });
  }

  // --- Logique de soumission (inchangée) ---
  submitNewDemande(apiRequestData: any): void {
    if (!this.employeId) {
        console.error("Cannot submit leave request without Employee ID.");
      
        return;
    }

    this.isLoading = true; // Indicate loading
    // Use the specific endpoint with the employee ID in the URL
    const apiUrl = `${this.apiBaseUrl}/ajouter/${this.employeId}`;

    this.http.post<Response>(apiUrl, apiRequestData).subscribe({ // Expecting the success message response
        next: (response) => {
            console.log('Réponse de l\'API:');
          
            // Since the API doesn't return the created object,
            // reload the list to show the new request.
            this.loadDemandesConge(); // Reload the data grid

            // No need to manually add to dataSource.data here
            this.isLoading = false;
        },
        error: () => {
            console.error('Erreur lors de la soumission de la demande:');
          
        }
    });
  }

 
  // Fonction utilitaire simple pour calculer les jours (pour démo, à faire côté backend idéalement)
  calculateBusinessDays(startDate: Date, endDate: Date): number {
      if (!startDate || !endDate) return 0;
      let count = 0;
      const curDate = new Date(startDate.getTime());
      while (curDate <= endDate) {
          const dayOfWeek = curDate.getDay();
          // Exclure Samedi (6) et Dimanche (0) - Ajustez si vos jours ouvrables sont différents
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              count++;
          }
          curDate.setDate(curDate.getDate() + 1);
      }
      return count;
  }


  // Méthode pour obtenir la classe CSS du statut
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'Approuvée': return 'bg-green-100 text-green-800';
      case 'Refusée': return 'bg-red-100 text-red-800';
      case 'En Attente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }



   // Méthode pour obtenir le texte lisible du type de congé
   getTypeCongeText(type: string): string {
    const foundType = this.typesConge.find(t => t.value === type);
    return foundType ? foundType.value : type;
  }

  // Méthode pour annuler une demande (si statut EN_ATTENTE)

  

}
