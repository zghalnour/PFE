import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CandidatureDetailsDialogComponent } from '../candidature-details-dialog/candidature-details-dialog.component';
export interface Candidature {
  id: number; // Assuming 'id' is the identifier, adjust if it's 'idCandidature' or similar
  name: string;
  scoreAI: string;
  testScore?: string;
  etat: string;
  // Add other properties as needed
}
export interface DeleteApiResponse {
  message: string;
}
@Component({
  selector: 'app-candidatures',
  templateUrl: './candidatures.component.html',
  styleUrl: './candidatures.component.css'
})
export class CandidaturesComponent implements OnInit {
  titreOffre: string = '';
  candidatures: any[] = [];

  constructor(private http: HttpClient, private dialog: MatDialog, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.titreOffre = params.get('titre') || '';
      console.log("Candidatures pour l'offre:", this.titreOffre);
      this.fetchCandidatures(this.titreOffre);
    });
  }
 deleteCandidature(candidatureToDelete: Candidature): void {
    // Confirmation dialog
    

  
    
      const apiUrl = `http://localhost:5053/api/Candidature/supprimer-candidature/${candidatureToDelete.id}`;

      this.http.delete<DeleteApiResponse>(apiUrl).subscribe({
        next: (response) => {
          console.log(response.message); // "Candidature supprimée avec succès."
          // Remove the candidature from the local array to update the UI
        
          this.candidatures = this.candidatures.filter(c => c.id !== candidatureToDelete.id);
        
        },
        error: (error) => {
          console.error('Error deleting candidature:', error);
        
          alert('Erreur lors de la suppression de la candidature.'); // Simple alert for now
        }
      });
  
  }
  

  fetchCandidatures(titreOffre: string) {
    const apiUrl = `http://localhost:5053/api/Offre/candidatures-par-offre-titre/${encodeURIComponent(titreOffre)}`;
    this.http.get<any>(apiUrl).subscribe(response => {
      if (response && response.candidatures) {
      
        this.candidatures = response.candidatures.map((cand: any) => ({
          id: cand.id,
          name: cand.candidat.nomPrenom,
          scoreAI: cand.scoreAI,
          testScore: `${cand.score}/${cand.reponses.length}`,
          etat: cand.statut,
          cvUrl: cand.candidat.cvPath,
          linkedinUrl:cand.candidat.linkedIn,
          extractedSkills: cand.competencesExtraites,
          testResults: cand.reponses.map((rep: any) => ({
            question: rep.intitule,
            candidateAnswer: rep.optionChoisie,
            isCorrect: rep.estCorrecte
          }))
        }));
      }
    }, error => {
      console.error('Erreur lors de la récupération des candidatures:', error);
    });
  }

  openDetails(candidature: any): void {
    this.dialog.open(CandidatureDetailsDialogComponent, {
      width: '700px',
      data: {
        id:candidature.id,
        cvUrl: candidature.cvUrl,
        linkedinUrl:candidature.linkedinUrl,
        extractedSkills: candidature.extractedSkills,
        testResults: candidature.testResults,
        state: candidature.etat
      }
    });
  }
  acceptCandidate(candidature: any) {
    this.updateCandidatureState(candidature.id, 'AcceptePreSelection');
  }

  rejectCandidate(candidature: any) {
    this.updateCandidatureState(candidature.id, 'RefusePreSelection');
  }

  // Mise à jour de l'état de la candidature
  updateCandidatureState(id: number, nouveauStatut: string) {
    const apiUrl = `http://localhost:5053/api/Candidature/modifier-statut/${id}/${nouveauStatut}`;
    
    this.http.put(apiUrl, {}, { headers: { 'Accept': 'application/json' } }).subscribe({
      next: (response: any) => {
        console.log(response.message);
        // Mettre à jour localement l'état de la candidature
        const updatedCandidature = this.candidatures.find(c => c.id === id);
        if (updatedCandidature) {
          updatedCandidature.etat = nouveauStatut;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut :', error);
      }
    });
  }

}
