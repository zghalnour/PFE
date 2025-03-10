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
  testDescription='';
  offre = {
    titre: '', // Nom de la propriété modifié pour correspondre à l'API
    description: '',
    competences: '',
    dateLimitePostulation: ''
  };
  questions = [{ enonce: '', option1: '', option2: '', option3: '', reponseCorrecte: 1 }];
  initialQuestionsCount: number ;  
  selectedEtat = 'all';
  searchCategory = '';
  offres: any[] = [];


  
  ngAfterViewInit() {
    
  }
  ngOnInit() {this.loadOffres();}
  loadOffres() {
    this.http.get<any[]>('http://localhost:5053/api/Offre/get-all-offres').subscribe(
      (response) => {
        // Transformation des données si nécessaire
        this.offres = response.map(offre => ({
          id:offre.id,
          titre: offre.titre,
          description: offre.description,
          competences: offre.competences,
          nbCandidatures: offre.nombreCandidatures,
          etat: offre.statut, // Renommé pour correspondre à votre affichage
          deadline: offre.dateLimite // Ajout temporaire, car API ne fournit pas de deadline
        }));
      },
      (error) => {
        console.error('Erreur lors du chargement des offres:', error);
      }
    );
  }
  nextStep() {
    this.isFirstStep = false;
  }
  previousStep() {
    this.isFirstStep = true;
  }
  addQuestion() {
    this.questions.push({ enonce: '', option1: '', option2: '', option3: '', reponseCorrecte: 1 });
  }

  // Fonction pour soumettre le formulaire complet
  submitForm() {
    // Créez un objet pour envoyer à votre API avec l'offre, la description du test et les questions
    const offerWithTest = {
      titre: this.offre.titre, // Correspond à l'API
      description: this.offre.description,
      competences: this.offre.competences,
      dateLimitePostulation: this.offre.dateLimitePostulation,
      testDescription: this.testDescription,
      questions: this.questions.map(q => ({
        enonce: q.enonce,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        reponseCorrecte: q.reponseCorrecte
      }))
    };
    console.log(offerWithTest);

    // Effectuer la requête HTTP pour ajouter l'offre avec les questions et la description du test
    this.http.post('http://localhost:5053/api/Offre/ajouter-offre-avec-test', offerWithTest)
      .subscribe(
        (response) => {
          console.log('Offre ajoutée avec succès:', response);
          this.offres.push(response); 

        // Recharger les offres depuis l'API (optionnel)
        this.loadOffres(); 

        // Réinitialiser le formulaire
        this.cancelForm();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de l\'offre:', error);
        }
      );
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
      this.selectedEtat === 'all' || offre.etat.toLowerCase() === this.selectedEtat.toLowerCase()
    );
  }

  editOffre(offre:any) {
    console.log('Modifier offre:', offre);
  }

  deleteOffre(id: any) {
    console.log('Supprimer offre avec ID:', id);
  
    // Appeler l'API DELETE pour supprimer l'offre
    this.http.delete('http://localhost:5053/api/Offre/supprimer-offre/' + id, { responseType: 'text' })
      .subscribe(
        (response) => {
          console.log('Réponse du serveur:', response);
  
          // Filtrer l'offre supprimée de la liste
          this.offres = this.offres.filter(offre => offre.id !== id);
          console.log('Offre supprimée avec succès, liste mise à jour:', this.offres);
  
          // Optionnel : vous pouvez aussi afficher un message de confirmation ou effectuer une autre action.
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'offre:', error);
        }
      );
  }
  
  

  viewCandidatures(titre: string) {

    this.router.navigate(['/candidatures', titre]); 
  }
  
}

