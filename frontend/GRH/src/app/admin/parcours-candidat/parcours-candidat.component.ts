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
  showCreateAccountButton: boolean = false;
  showDecisionDialog = false;
  decisionResult: 'accepter' | 'refuser' | null = null;
  
  
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = +params.get('id')!;
      this.candidatureId = id;
      this.loadEntretiens(this.candidatureId); // ou une autre méthode liée à ce parcours
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
  
    if (choice === 'refuser') {
      // ici tu peux déclencher l'envoi d'email côté service si nécessaire
      console.log("Email envoyé au candidat");
    }
  }
  
}
