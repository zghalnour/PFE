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
    titre: '',
    typeContrat:'', // Nom de la propriété modifié pour correspondre à l'API
    description: '',
    competences: '',
    dateLimitePostulation: ''
  };
  questions = [{ enonce: '', option1: '', option2: '', option3: '', reponseCorrecte: 1 }];
  initialQuestionsCount: number ;  
  selectedEtat = 'all';
  searchCategory = '';
  
  offres: any[] = [];
  isEditing: boolean = false; // Variable pour afficher/masquer le formulaire
  currentOffre: any = { questions: [] };
  currentQuestionIndex: number =0;

  newQuestion = {
    intitule: '',
    options: ['', '', ''],
    reponseCorrecte: 1
  };



ngOnInit() {
  this.loadOffres();
}

previousQuestion() {
  if (this.currentQuestionIndex > 0) {
    this.currentQuestionIndex--;
  }
}

nextQuestion() {
  if (this.currentQuestionIndex < this.currentOffre.questions.length - 1) {
    this.currentQuestionIndex++;
  }
}


onQuestionChange() {
  // Handle question change if needed
  console.log('Question changed');
}

addNewQuestion() {
  this.addQuestion();
}
editOffre(offre: any) {
  // Afficher le formulaire de modification
  this.isEditing = true;
  this.currentQuestionIndex=0;
  this.getOffreById(offre.id); 
  

 }


cancelEdit() {
  
  this.isEditing = false;
    this.currentOffre = {}; 
}
getOffreById(id: number) {
  this.http.get(`http://localhost:5053/api/Offre/get-offre/${id}`).subscribe(
    (response: any) => {
      this.currentOffre = {
        ...response,
        questions: response.questions ? response.questions : []
      };
    },
    (error) => {
      console.error('Erreur lors du chargement de l\'offre:', error);
    }
  );
}

updateOffre() {
  // Appel à l'API pour mettre à jour l'offre
  this.http.put(`http://localhost:5053/api/Offre/modifier-offre/${this.currentOffre.id}`, this.currentOffre).subscribe(
    (response) => {
      console.log('Offre mise à jour avec succès:', response);
      this.isEditing = false; // Cacher le formulaire après la mise à jour
      this.loadOffres(); // Recharger les offres après la mise à jour
    },
    (error) => {
      console.error('Erreur lors de la mise à jour de l\'offre:', error);
    }
  );
}
loadOffres() {
  this.http.get<any[]>('http://localhost:5053/api/Offre/get-all-offres').subscribe(
    (response) => {
      // Transformation des données reçues de l'API
      this.offres = response.map(offre => ({
        id: offre.id,
        titre: offre.titre,
      
        description: offre.description,
        competences: offre.competences,
        nbCandidatures: offre.nombreCandidatures,
        etat: offre.statut, // Renommé pour l'affichage
        deadline: offre.dateLimite,
        testId: offre.testId,
        questions: offre.questions ? offre.questions.map((question: any) => ({
          id: question.id,
          intitule: question.intitule,
          option1: question.option1,
          option2: question.option2,
          option3: question.option3,
          reponseCorrecte: question.reponseCorrecte // Ici, on suppose que `reponseCorrecte` est un nombre
        })) : [] // Si questions est undefined ou null, on met un tableau vide
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
      titre: this.offre.titre,
      typeContrat:this.offre.typeContrat,
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

