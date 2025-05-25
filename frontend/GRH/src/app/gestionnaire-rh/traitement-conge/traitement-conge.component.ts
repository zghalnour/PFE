import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DatePipe } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';
export interface DemandeConge {
  id: number;
  employeId: number;
  nomEmploye: string; 
  dateDebut: Date;    
  dateFin: Date;      
  dateDemande: Date;  
  raison: string;     
  type: string;       
  statut: 'En Attente' | 'Approuvée' | 'Refusée';    
}





@Component({
  selector: 'app-traitement-conge',
  templateUrl: './traitement-conge.component.html',
  styleUrls: ['./traitement-conge.component.css'],
  providers: [DatePipe]
})
export class TraitementCongeComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['nomComplet', 'dateDebut', 'dateFin','nbJours', 'typeConge', 'raison','statut', 'actions'];
  dataSource = new MatTableDataSource<DemandeConge>([]); // Initialize empty
  filterForm: FormGroup;
  statuts: string[] = ['En Attente', 'Approuvée', 'Refusée']; // Pour le filtre par statut
  employes: string[] = []; // Liste des employés pour le filtre (à remplir)

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private readonly apiBaseUrl = 'http://localhost:5053/api/DemCong'; 
  // Injectez FormBuilder et DatePipe ici
  constructor(private fb: FormBuilder, private datePipe: DatePipe, private http: HttpClient) {
    // Initialisation du formulaire de filtre
    this.filterForm = this.fb.group({
      nomEmploye: [''],
      statut: [''],
      dateDebut: [null],
      dateFin: [null]
    });
  }

  ngOnInit(): void {
    this.loadDemandes(); // Load data from API

    // Apply custom filtering when form values change
    this.filterForm.valueChanges.subscribe(() => {
      this.appliquerFiltres();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Définir le prédicat de filtrage personnalisé
    this.dataSource.filterPredicate = this.creerFiltre();
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
  loadDemandes(): void {
  
    const apiUrl = `${this.apiBaseUrl}/all`;

    this.http.get<DemandeConge[]>(apiUrl).subscribe({
      next: (apiData) => {
        // Map API data to the component's interface (convert dates)
        this.dataSource.data = apiData.map(apiDemande => ({
          ...apiDemande,
          dateDebut: new Date(apiDemande.dateDebut),
          dateFin: new Date(apiDemande.dateFin),
          dateDemande: new Date(apiDemande.dateDemande)
        }));

        // Populate filter options based on loaded data
        this.employes = [...new Set(this.dataSource.data.map(d => d.nomEmploye))].sort();
      

        console.log('Demandes de congé chargées:', this.dataSource.data);
        // Apply initial filter if needed (e.g., show only 'En Attente' by default)
        // this.filterForm.patchValue({ statut: 'En Attente' });
        // this.appliquerFiltres();
      },
      error: () => {
        console.error('Erreur lors du chargement des demandes:');
        
      }
    });
  }

  creerFiltre(): (data: DemandeConge, filter: string) => boolean {
    const filterFunction = (data: DemandeConge, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      const nomComplet = `${data.nomEmploye} `.toLowerCase();

      // Vérification de correspondance pour chaque champ de filtre
      const matchNom = !searchTerms.nomEmploye || nomComplet.includes(searchTerms.nomEmploye.toLowerCase());
      const matchStatut = !searchTerms.statut || data.statut === searchTerms.statut;

      // Gestion des dates (vérifier si la période de la demande chevauche la période du filtre)
      const dateDebutDemande = data.dateDebut.getTime();
      const dateFinDemande = data.dateFin.getTime();
      const dateDebutFiltre = searchTerms.dateDebut ? new Date(searchTerms.dateDebut).getTime() : null;
      const dateFinFiltre = searchTerms.dateFin ? new Date(searchTerms.dateFin).getTime() : null;

      let matchDate = true;
      if (dateDebutFiltre && dateFinFiltre) {
        // Chevauchement : (StartA <= EndB) and (EndA >= StartB)
        matchDate = dateDebutDemande <= dateFinFiltre && dateFinDemande >= dateDebutFiltre;
      } else if (dateDebutFiltre) {
        matchDate = dateFinDemande >= dateDebutFiltre; // La demande se termine après ou pendant le début du filtre
      } else if (dateFinFiltre) {
        matchDate = dateDebutDemande <= dateFinFiltre; // La demande commence avant ou pendant la fin du filtre
      }

      return matchNom && matchStatut && matchDate;
    };
    return filterFunction;
  }
  formatDate(date: Date | string | null): string { // Accept string as well for safety
    if (!date) return '-';
    try {
        // Ensure it's a valid Date object
        const dateObj = (date instanceof Date) ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
            return '-'; // Return '-' if parsing failed
        }
        // Use DatePipe for formatting (ensure DatePipe is injected in constructor)
        // Or use toLocaleDateString for simpler formatting:
        return dateObj.toLocaleDateString('fr-FR', { // Use French locale
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return '-'; // Fallback for any unexpected error
    }
}
getStatutClass(statut: string): string {
  if (!statut) return 'status-default'; // Handle null/undefined status

  const lowerStatut = statut.toLowerCase();
  if (lowerStatut.includes('approuve')) return 'status-approved';
  if (lowerStatut.includes('refuse') || lowerStatut.includes('refus')) return 'status-refused'; // Handle 'Rejetée' or 'Refusée'
  if (lowerStatut.includes('attente')) return 'status-pending';
  return 'status-default'; // Default class for unknown statuses
}


  appliquerFiltres() {
    // Convertir les dates en format ISO pour une comparaison fiable si nécessaire
    const filterValue = {
      nomEmploye: this.filterForm.value.nomEmploye,
      statut: this.filterForm.value.statut,
      dateDebut: this.filterForm.value.dateDebut ? this.datePipe.transform(this.filterForm.value.dateDebut, 'yyyy-MM-dd') : null,
      dateFin: this.filterForm.value.dateFin ? this.datePipe.transform(this.filterForm.value.dateFin, 'yyyy-MM-dd') : null,
    };
    this.dataSource.filter = JSON.stringify(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFiltres() {
    this.filterForm.reset({
      nomEmploye: '',
      statut: '',
      dateDebut: null,
      dateFin: null
    });
    // appliquerFiltres() sera appelé automatiquement par valueChanges
  }

  approuverDemande(demande: DemandeConge) {
    console.log('Approuver demande:', demande.id);
  
    this.http.put(`http://localhost:5053/api/DemCong/ModifierStatut/${demande.id}`, { nouveauStatut: 'Approuvée' })
      .subscribe({
        next: (response: any) => {
          console.log('Réponse serveur:', response.message);
          
          // Mise à jour locale après succès
          const index = this.dataSource.data.findIndex(d => d.id === demande.id);
          if (index > -1) {
            this.dataSource.data[index].statut = 'Approuvée';
            this.dataSource._updateChangeSubscription(); // Notifier la table du changement
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      });
  }
  

  rejeterDemande(demande: DemandeConge) {
    console.log('Rejeter demande:', demande.id);
    this.http.put(`http://localhost:5053/api/DemCong/ModifierStatut/${demande.id}`, { nouveauStatut: 'Refusée' })
    .subscribe({
      next: (response: any) => {
        console.log('Réponse serveur:', response.message);
        
        // Mise à jour locale après succès
        const index = this.dataSource.data.findIndex(d => d.id === demande.id);
        if (index > -1) {
          this.dataSource.data[index].statut = 'Refusée';
          this.dataSource._updateChangeSubscription(); // Notifier la table du changement
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    });
  }
}