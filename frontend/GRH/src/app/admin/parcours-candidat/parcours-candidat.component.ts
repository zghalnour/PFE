import { Component ,OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface ParcourEntretien {
  id: number;
  typeEntretien: string;
  dateEntretien: string;
  statut: string;
  commentaire: string;
  modeEntretien: string;
  responsableNom: string;
  nomCandidat?: string;
  emailCandidat?: string;
  telephoneCandidat?: string;
  poste?:string
}
export interface CandidatureStatus {
  id: number;
  statut: string;
}

@Component({
  selector: 'app-parcours-candidat',
  templateUrl: './parcours-candidat.component.html',
  styleUrl: './parcours-candidat.component.css'
})
export class ParcoursCandidatComponent implements OnInit {
  entretiens: ParcourEntretien[] = [];
  candidatureId!: number;
  
  candidatNom: string = '';
  candidatEmail: string = '';
  candidatTlph: string = '';
  candidatPoste: string = '';
  responsableNom:string='';
  showCreateAccountButton: boolean = false;
  showDecisionDialog = false;
  showFinalDecisionButton: boolean = true;
  decisionResult: 'accepter' | 'refuser' | null = null;
  private readonly notificationApiBaseUrl = 'http://localhost:5053/api/Notif';

  
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idString = params.get('id');
      if (idString) {
        const id = +idString;
        if (!isNaN(id) && id > 0) { // Vérifie si l'ID est un nombre valide et positif
          this.candidatureId = id;
          this.loadCandidatureData(this.candidatureId);
          this.loadEntretiens(this.candidatureId);

          // Lire notificationId depuis les query params et marquer comme lu
        
        } else {
          console.error('ID de candidature invalide dans les paramètres de la route:', idString);
          // Gérer l'erreur, par exemple, rediriger ou afficher un message
        }
      } else {
        console.error('ID de candidature non trouvé dans les paramètres de la route.');
        // Gérer l'erreur
      }
    });
    // console.log(this.decisionResult); // Supprimé car il logue la valeur initiale null
  }

    loadCandidatureData(id: number): void {
    this.loadCandidatureStatus(id);
  }
  
    loadCandidatureStatus(id: number): void {
    this.http.get<CandidatureStatus>(`http://localhost:5053/api/Candidature/${id}/statut`)
      .subscribe({
        next: (response) => {
          const currentStatus = response.statut;
          console.log('Statut de la candidature chargé:', currentStatus);

          if (currentStatus === 'Accepté') {
            this.showCreateAccountButton = true;
            this.showFinalDecisionButton = false; // Décision finale déjà prise
          } else if (currentStatus === 'Refusé') {
            this.showCreateAccountButton = false;
            this.showFinalDecisionButton = false; // Décision finale déjà prise
          } else {
            // Pour les autres statuts (ex: 'En cours', 'Préselectionné', etc.)
            this.showCreateAccountButton = false;
            this.showFinalDecisionButton = true; // Permettre de prendre une décision finale
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement du statut de la candidature:', err);
          this.showFinalDecisionButton = false; // Ne pas montrer le bouton si le chargement échoue
          this.showCreateAccountButton = false;
        }
      });
  }

  loadEntretiens(id: number): void {
    this.http.get<ParcourEntretien[]>(`http://localhost:5053/api/Candidature/${id}/entretiens`)
      .subscribe({
        next: (data) => {
          // Créer un entretien statique et l'ajouter au début de la liste
          const entretienStatique: ParcourEntretien = {
            id: 0,
            typeEntretien: 'Préselection',
            dateEntretien: new Date().toISOString(),
            statut: 'Passé',
            commentaire: 'L’administrateur a présélectionné ce candidat à l’aide du score IA du CV envoyé.',
            modeEntretien: '',
            responsableNom: 'Admin',
            
          };
          
          // Ajouter l'entretien statique au début de la liste
          this.entretiens = [entretienStatique, ...data];
          console.log('Entretiens:', this.entretiens);
          this.candidatNom=data[0].nomCandidat || '';
          this.candidatEmail=data[0].emailCandidat || '';
          this.candidatTlph=data[0].telephoneCandidat || '';
          this.candidatPoste=data[0].poste || '';
          
          
        },
        error: (err) => {
          console.error('Erreur chargement entretiens:', err);
        }
      });
  }
   // Fonction pour formater la date si nécessaire (similaire à celle du dashboard)
   formatDate(date: Date | string | undefined): string {
     if (!date) return '';
     const parsedDate = new Date(date);
     if (isNaN(parsedDate.getTime())) return '';
     return parsedDate.toLocaleDateString('fr-FR') ;
   }

   // Fonction pour obtenir une classe CSS basée sur le statut de l'étape
   getEtapeStatusClass(statut?: string): string {
     if (!statut) return 'pending'; // Ou une classe par défaut
     const lowerStatut = statut.toLowerCase();
     if (lowerStatut === 'passé' || lowerStatut.includes('accepte') || lowerStatut === 'terminé') return 'completed';
     if (lowerStatut === 'echoué' || lowerStatut.includes('refuse')) return 'failed';
     if (lowerStatut === 'en cours' || lowerStatut.includes('programmé')) return 'in-progress';
     return 'pending';
   }

  openDecisionDialog() {
    this.showDecisionDialog = true;
    this.decisionResult = null;
  }
  handleDecisionClick() {
    this.openDecisionDialog();
  }
  
  finalDecision(choice: 'accepter' | 'refuser') {
    this.showDecisionDialog = false;
    this.decisionResult = choice;
     const decisionPrise:boolean=true;
       const notifIdString = this.route.snapshot.queryParamMap.get('notifId');
          if (notifIdString) {
            const notificationId = +notifIdString;
            if (!isNaN(notificationId) && notificationId > 0) {
              this.callMarkAsReadApi(notificationId);
            } else {
              console.warn('ID de notification invalide ou manquant dans les paramètres de requête:', notifIdString);
            }
          }
    if (choice === 'refuser') {
      if (this.candidatureId) {
        this.updateCandidatureStatus(this.candidatureId, 'Refusé');
      
      } else {
        console.error('Candidature ID is not available to update status.');
    
      }
      // ici tu peux déclencher l'envoi d'email côté service si nécessaire
      console.log("Email envoyé au candidat");
    }
  }
    updateCandidatureStatus(candidatureId: number, newStatus: string): void {
    this.http
      .put<any>( // Replace <any> with a more specific interface if your API returns a body
        `http://localhost:5053/api/Candidature/modifier-statut/${candidatureId}/${newStatus}`,
        {} // Empty body, as the status is in the URL
      )
      .subscribe({
        next: (response) => {
        
          console.log(
            `Candidature ${candidatureId} status updated to ${newStatus} successfully.`,
            response
          );
          // Optionally, you might want to refresh some data or show a success notification
        },
        error: (error) => {
          console.error(
            `Error updating candidature ${candidatureId} status to ${newStatus}:`,
            error
          );
          // Optionally, show an error notification to the user
        },
      });
  }

  private callMarkAsReadApi(notificationId: number): void {
    const apiUrl = `${this.notificationApiBaseUrl}/markAsRead/${notificationId}`;
    this.http.put(apiUrl, {}).subscribe({ // Corps vide pour PUT comme dans l'exemple curl
      next: (response) => {
        console.log(`Notification ${notificationId} marquée comme lue avec succès. Réponse API:`, response);
        // Si vous avez besoin de mettre à jour l'état global des notifications (par ex. dans HeaderComponent),
        // un service partagé ou un mécanisme d'événements serait nécessaire.
      },
      error: (error) => {
        console.error(`Erreur lors du marquage de la notification ${notificationId} comme lue:`, error);
        // Gérer l'erreur, par exemple, afficher un message toast à l'utilisateur.
      }
    });
  }
  
}
