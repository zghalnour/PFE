import { Component ,OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface ParcoursEtape {
  etapeNom: string;
  responsableNom: string;
  date?: string | Date; // Date de l'entretien ou de l'étape
  statut?: string; // Ex: 'Passé', 'Echoué', 'En cours', 'Terminé'
  commentaire?: string; // Commentaire de l'entretien
}
@Component({
  selector: 'app-parcours-candidat',
  templateUrl: './parcours-candidat.component.html',
  styleUrl: './parcours-candidat.component.css'
})
export class ParcoursCandidatComponent implements OnInit {
  candidatureId: number | null = null;
  parcours$: Observable<ParcoursEtape[]> | null = null; // Utiliser un Observable pour le template async
  candidatNom: string = ''; // Pour afficher le nom

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.candidatureId = +idParam;
      // Appel API pour récupérer les données du parcours ET le nom du candidat
      this.parcours$ = this.http.get<ParcoursEtape[]>(`http://localhost:5053/api/candidatures/${this.candidatureId}/parcours`);

      // Optionnel: Appel séparé pour les détails du candidat si non inclus dans l'API parcours
      this.http.get<any>(`http://localhost:5053/api/Candidature/getCandidatureById/${this.candidatureId}`)
         .subscribe(candidat => this.candidatNom = candidat.nomPrenom);
    } else {
      console.error("ID de candidature manquant dans l'URL");
      // Gérer l'erreur, peut-être rediriger
    }
  }

   // Fonction pour formater la date si nécessaire (similaire à celle du dashboard)
   formatDate(date: Date | string | undefined): string {
     if (!date) return '';
     const parsedDate = new Date(date);
     if (isNaN(parsedDate.getTime())) return '';
     return parsedDate.toLocaleDateString('fr-FR') + ' ' + parsedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

}
