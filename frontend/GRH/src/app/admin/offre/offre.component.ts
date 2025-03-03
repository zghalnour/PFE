import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-offre',
  templateUrl: './offre.component.html',
  styleUrl: './offre.component.css'
})
export class OffreComponent implements OnInit {
  constructor(private http: HttpClient, private router: Router) {this.initialQuestionsCount =1;}

  isOpenForm = false;
  isFirstStep = true;
  offer = { title: '', description: '', skills: '' };
  questions = [{ text: '', options: ['', '', ''], correctAnswer: 'A' }];
  initialQuestionsCount: number ;  
  selectedEtat = 'all';
  searchCategory = '';
  offres = [
    { 
      id: 1, 
      titre: 'Développeur Angular', 
      etat: 'Ouverte', 
      nbCandidatures: 10, 
      competencesRequises: 'Angular, TypeScript, HTML, CSS',
      description: 'Développement d\'applications web en Angular avec une forte interaction avec les utilisateurs '
    },
    { 
      id: 2, 
      titre: 'Chef de projet IT', 
      etat: 'Fermée', 
      nbCandidatures: 5, 
      competencesRequises: 'Gestion de projet, Agile',
      description: 'Supervision de projets IT, gestion d\'équipe, suivi des plannings et des budgets.'
    }
  ];
  


  

  ngOnInit() {}
  nextStep() {
    this.isFirstStep = false;
  }
  previousStep() {
    this.isFirstStep = true;
  }
  addQuestion() {
    this.questions.push({ text: '', options: ['', '', ''], correctAnswer: 'A' });
  }
  // Fonction pour soumettre le formulaire complet
  submitForm() {
    // Traitement pour soumettre l'offre avec les questions
    console.log(this.offer);
    console.log(this.questions);
  }
  

  cancelForm() {
    this.isOpenForm = false; // Ferme le formulaire
  }


  // Méthode pour basculer la valeur de isOpenForm
  toggleForm() {
    this.isOpenForm = !this.isOpenForm;
  }



  cancelLastQuestion() {
    if (this.questions.length > this.initialQuestionsCount) {
      this.questions.pop(); // Supprime la dernière question ajoutée
    }
  }


  
  onEtatChange() {
    // Appeler cette fonction lorsqu'un état est sélectionné pour mettre à jour la liste filtrée
    console.log('Etat sélectionné:', this.selectedEtat);
  }

  // Méthode de filtre des offres
  filteredOffres() {
    return this.offres.filter(offre => 
      (this.selectedEtat === 'all' || offre.etat.toLowerCase() === this.selectedEtat.toLowerCase())
    );
  }

  editOffre(offre:any) {
    console.log('Modifier offre:', offre);
  }

  deleteOffre(id:any) {
    console.log('Supprimer offre avec ID:', id);
  }

  viewCandidatures(id: any) {
    console.log('Voir candidatures pour l\'offre ID:', id);
    this.router.navigate(['/candidatures', id]);  // Navigates to the candidatures page with the offer ID
  }
}

