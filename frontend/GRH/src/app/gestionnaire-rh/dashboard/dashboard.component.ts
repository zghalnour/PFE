import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar'; 
export interface Candidature {
  id: number;
  statut: string; // Add statut
  nomOffre: string; // Add nomOffre
  nomPrenom: string;
  email: string;
  telephone: string;
  entretiens: Entretien[]; // Add entretiens
}

// In a file like entretien.model.ts or in your dashboard.ts if you don't have a separate model file
export interface Entretien {
  id: number;
  candidatureId?: number;
  typeEntretien: string;
  dateEntretien: Date;
  statut: string;
  commentaire: string;
  modeEntretien: string;
  responsableId?: number | null;
  showDecision?: boolean;
  decisionPrise?: boolean;


}
export interface Responsable {
  id: number;
  nomPrenom: string;
  poste: string;
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  candidatures: Candidature[] = [];
  entretiens: { [candidatureId: number]: Entretien[] } = {};
  offres: string[] = [];
  selectedOffre: string = '';
  filteredCandidatures: Candidature[] = [];
  selectedCandidature: Candidature | null = null;
  searchTerm: string = '';
  responsables: Responsable[] = [];
  nouvelEntretien: Partial<Entretien> = { typeEntretien: '', dateEntretien: new Date() ,modeEntretien: '',responsableId: null};


  constructor(private http: HttpClient,private snackbar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadCandidatures();
    this.loadResponsables();
  }
  loadResponsables(): void {
    this.http.get<Responsable[]>('http://localhost:5053/api/Employe/getAllEmployes').subscribe({
      next: (data) => {
        // Vous pouvez filtrer ici si seuls certains postes peuvent être responsables
        // Exemple : this.responsables = data.filter(emp => emp.poste === 'Manager' || emp.poste === 'Chef Informatique');
        this.responsables = data; // Pour l'instant, on prend tous les employés
        console.log('Responsables (Employés) chargés:', this.responsables);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des responsables (Employés):', error);
      }
    });
  }
  loadCandidatures(): void {

    this.http.get<Candidature[]>('http://localhost:5053/api/Candidature/getAllCandidatures').subscribe({
      next: (data) => {
        this.candidatures = data.filter(candidature => candidature.statut!=='RefusePreSelection');
        this.extractOffres();
        this.filterCandidatures();
        this.loadEntretiensForAllCandidatures();
      },
      error: (error) => {
        console.error('Error fetching candidatures:', error);
        
      },
    });
  }
  loadEntretiensForAllCandidatures(): void {
    this.candidatures.forEach((candidature) => {
      this.loadEntretiens(candidature.id);
    });
  }

  loadEntretiens(candidatureId: number): void {
    this.http
      .get<Entretien[]>(`http://localhost:5053/api/Candidature/${candidatureId}/entretiens`)
      .subscribe({
        next: (data) => {
          this.entretiens[candidatureId] = data.map(entretien => ({
            ...entretien,
            date: new Date(entretien.dateEntretien),
            showDecision: false,
            decisionPrise: entretien.statut === 'En cours' ? false : true,
            
          
          }));
        },
        error: (error) => {
          console.error(`Error fetching entretiens for candidature ${candidatureId}:`, error);
        },
      });
  }



  extractOffres(): void {
    this.offres = [...new Set(this.candidatures.map((candidature) => candidature.nomOffre))];
  }

  filterCandidatures(): void {
    this.filteredCandidatures = this.candidatures.filter((candidature) => {
      return this.selectedOffre ? candidature.nomOffre === this.selectedOffre : true;
    });
  }
  creerEntretien(): void {
    if (!this.selectedCandidature || !this.nouvelEntretien.typeEntretien || !this.nouvelEntretien.dateEntretien) return;

  

    const entretienData = {
      candidatureId: this.selectedCandidature.id,
      typeEntretien: this.nouvelEntretien.typeEntretien,
      modeEntretien: this.nouvelEntretien.modeEntretien,
      dateEntretien: this.nouvelEntretien.dateEntretien,
      responsableId: this.nouvelEntretien.responsableId 
    };

    this.http.post<number>('http://localhost:5053/api/Entretien/add', entretienData,)
      .subscribe({
        next: (newEntretienId) => {
          console.log('New entretien created with ID:', newEntretienId);
          // Update the local list of entretiens
          this.loadEntretiens(this.selectedCandidature!.id);
        
          this.updateCandidatureStatus(
            this.selectedCandidature!.id,
            `Entretien${this.nouvelEntretien.typeEntretien}Programmé`
          );
          this.nouvelEntretien = { typeEntretien: '', dateEntretien: new Date(), modeEntretien: 'présentiel',responsableId: null };
          
        },
        error: (error) => {
          console.error('Error creating entretien:', error);
        },
      });
  }

  updateEntretien(entretien: Entretien, status: 'Passé' | 'Echoué'): void {
    entretien.statut = status;
   entretien.decisionPrise = true;

    
    const entretienData = {
      commentaire: entretien.commentaire,
      statut: entretien.statut,
    };
    this.http.put<Entretien>(`http://localhost:5053/api/Entretien/update/${entretien.id}`, entretienData).subscribe({
      next: (updatedEntretien) => {
        console.log('entretien updated:', updatedEntretien);
        if (updatedEntretien.candidatureId) {
          console.log("heloo");
          this.loadEntretiens(updatedEntretien.candidatureId);
          const newStatus = `Entretien${entretien.typeEntretien}${status === 'Passé' ? 'Accepte' : 'Refuse'}`;
        
          this.updateCandidatureStatus(
            updatedEntretien.candidatureId,
            newStatus // Use the corrected newStatus
          );
        }
      
        entretien.showDecision = true;
      },
      error: (error) => {
        console.error('Error updating entretien:', error);
      },
    });
  }

  updateCandidatureStatus(candidatureId: number, newStatus: string): void {
    this.http
      .put<any>(
        `http://localhost:5053/api/Candidature/modifier-statut/${candidatureId}/${newStatus}`,
        {}
      )
      .subscribe({
        next: (response) => {
          console.log(
            `Candidature ${candidatureId} status updated to ${newStatus}`,
            response
          );
          this.loadCandidatures();
        },
        error: (error) => {
          console.error(
            `Error updating candidature ${candidatureId} status:`,
            error
          );
        },
      });
  }
  getResponsableNom(responsableId: number | null | undefined): string {
    if (!responsableId) {
      return 'Non assigné'; // Ou une autre valeur par défaut
    }
    const responsable = this.responsables.find(resp => resp.id === responsableId);
    return responsable ? responsable.nomPrenom : 'Inconnu'; // Retourne le nom ou 'Inconnu' si non trouvé
  }

  openModal(candidature: Candidature): void {
    this.selectedCandidature = candidature;
  }

  closeModal(): void {
    this.selectedCandidature = null;
  
  }
  planifierEntretien(entretien: Entretien): void {
    entretien.statut = 'En cours';
  }

  
  toggleDecision(entretien: any) {
    entretien.showDecision = !entretien.showDecision;
  
    
  }
  formatDate(date: Date | string): string {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString('fr-FR');
  }
  
  notifyAdmin(candidature: Candidature): void {
    console.log('Tentative de notification pour la candidature:', candidature.id);

    // --- IMPORTANT ---
    // Replace '1' with the actual logic to get the Admin's UtilisateurId.
    // This might come from a configuration service, user service, or be a known constant.
    const adminUserId = 1; // <<< REMPLACEZ CECI PAR LA VRAIE LOGIQUE D'OBTENTION DE L'ID ADMIN

    if (!adminUserId) {
        console.error("Impossible de déterminer l'ID de l'administrateur destinataire.");
        // Optionnel: Afficher un message d'erreur à l'utilisateur
        // this.snackbar.open('Erreur: ID Administrateur non trouvé.', 'Fermer', { duration: 3000 });
        return; // Stop execution if admin ID is not found
    }

    // Prepare the data according to the backend's CreateNotificationRequest model
    const notificationRequest = {
      UtilisateurId: adminUserId, // Use the determined Admin User ID
      CandidatureId: candidature.id
    };

    // Use the correct API endpoint URL provided by your backend
    const apiUrl = 'http://localhost:5053/api/Notif/createNotificationForAdmin'; // Corrected endpoint

    this.http.post(apiUrl, notificationRequest) // Send the correct request object
      .subscribe({
        next: (response: any) => { // Type the response if you know its structure, e.g., { message: string }
          console.log('Notification envoyée avec succès. Réponse serveur:', response);
          // Optionnel : Afficher un message de succès à l'utilisateur (ex: Snackbar)
           const successMessage = response?.message || 'Notification envoyée à l\'administrateur.';
           this.snackbar.open(successMessage, 'OK', { duration: 3000 });
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi de la notification:', error);
          // Optionnel : Afficher un message d'erreur plus détaillé
           const errorMessage = error?.error?.message || 'Erreur lors de l\'envoi de la notification.';
           this.snackbar.open(errorMessage, 'Fermer', { duration: 5000 });
        }
      });
  }

  getStatusColor(statut: string): string {
    if (statut.toLowerCase().includes('accepte')) {
      return 'green';
    } else if (statut.toLowerCase().includes('refuse') || statut.toLowerCase().includes('programmé')) {
      return 'red';
    } else {
      return 'black'; // Default color
    }
  }
  
}
