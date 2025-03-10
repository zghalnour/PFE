import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CandidatureDetailsDialogComponent } from '../candidature-details-dialog/candidature-details-dialog.component';

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
        cvUrl: candidature.cvUrl,
        extractedSkills: candidature.extractedSkills,
        testResults: candidature.testResults,
        state: candidature.etat
      }
    });
  }
}
