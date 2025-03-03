import { Component ,OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { CandidatureDetailsDialogComponent } from '../candidature-details-dialog/candidature-details-dialog.component';
@Component({
  selector: 'app-candidatures',
  templateUrl: './candidatures.component.html',
  styleUrl: './candidatures.component.css'
})
export class CandidaturesComponent implements OnInit {
  offerId: any;
  candidatures: any[] = []; // Example array for candidatures data

  constructor(private http: HttpClient,private dialog: MatDialog,private route: ActivatedRoute,private router: Router) {}

 ngOnInit(): void {
    this.offerId = this.route.snapshot.paramMap.get('id');
    console.log('Candidatures for offer ID:', this.offerId);
    
    // Fetch candidatures from your service (assuming you have a service for this)
    this.fetchCandidatures(this.offerId);
  }
  openDetails(candidature: any): void {
    const testData = {
      cvUrl: 'https://example.com/cv.pdf',  // Lien fictif vers un CV
      extractedSkills: ['JavaScript', 'Angular', 'TypeScript', 'Node.js'],  // Compétences fictives
      testResults: [
        { question: 'Quelle est la capitale de la France ?', candidateAnswer: 'Paris', isCorrect: true },
        { question: '2 + 2 = ?', candidateAnswer: '5', isCorrect: false },
        { question: 'Langage utilisé pour le développement web ?', candidateAnswer: 'Python', isCorrect: true },
        { question: 'Quelle est la couleur du ciel ?', candidateAnswer: 'Vert', isCorrect: false },
        { question: 'Quelle est la capitale de la France ?', candidateAnswer: 'Paris', isCorrect: true },
        { question: '2 + 2 = ?', candidateAnswer: '5', isCorrect: false },
        { question: 'Langage utilisé pour le développement web ?', candidateAnswer: 'Python', isCorrect: true },
        { question: 'Quelle est la couleur du ciel ?', candidateAnswer: 'Vert', isCorrect: false },
      ],
      state:'en cours'
    };
  
    this.dialog.open(CandidatureDetailsDialogComponent, {
      width: '700px',
      data: testData
    });
  }
  

  fetchCandidatures(offerId: any) {
    // Simulate a service call to get candidatures (replace with actual service logic)
    this.candidatures = [
      {
        name: "Jean Dupont",
        scoreAI: 85,
        testScore: 90,
        etat: "accepte"  // État "accepte"
      },
      {
        name: "Marie Martin",
        scoreAI: 70,
        testScore: 75,
        etat: "en cours"  // État "en cours"
      },
      {
        name: "Paul Durand",
        scoreAI: 60,
        testScore: 65,
        etat: "refuse"  // État "refuse"
      }
    ];
  }

}
