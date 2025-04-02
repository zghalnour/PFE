import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  isModalOpen: boolean = false;
  currentStep: string = 'form';

  searchQuery: string = '';
  selectedContract: string = '';
  selectedCompany: string = '';

  contractTypes: string[] = ['CDI', 'CDD', 'Stage', 'Contrat d\'apprentissage'];

  selectedJob: any = null;
  applicant = {
    offreId: 1,  // ID de l'offre
    nomPrenom: '',  // Nom et prénom de l'utilisateur
    email: '',  // Email de l'utilisateur
    telephone: '',  // Téléphone de l'utilisateur
    linkedin: '',  // Profil LinkedIn de l'utilisateur
    cv: null as File | null,  // Le fichier du CV (null si aucun fichier n'est sélectionné)
    reponses: [] as Array<{ questionId: number, optionChoisieId: number }>,  // Liste des réponses au test
  };
  Question = {
    id: 1,
    intitule: '',
    option1: '',
    option2: '',
    option3: '',
    // Vous pouvez ajouter d'autres propriétés si nécessaire
  };
  

  jobs: any[] = [];


  constructor(private router: Router) {
    this.fetchJobs();
  }
  async fetchJobs() {
    try {
      const response = await fetch('http://localhost:5053/api/Offre/get-all-offres');
      if (!response.ok) throw new Error('Erreur lors de la récupération des offres');
      
      const data = await response.json();
      this.jobs = data.map((job: any) => ({
        id:job.id,
        title: job.titre,
        type: job.typeContrat,
        skills: job.competences.split(', '),
        deadline: job.dateLimite,
        description: job.description,
        descrTest: job.descTest,
        testQuestions: job.questions.map((q: any) => ({
          id:q.id,
          text: q.intitule,
          options: [q.option1, q.option2, q.option3].filter(opt => opt), // Filtrer les options vides
          selectedOption: null
        }))
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des offres :', error);
    }
  }


  goToLogin() {
    this.router.navigate(['/login']);
  }
  filteredJobs() {
    return this.jobs.filter(
      (job) =>
        (this.searchQuery === '' || job.title.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
        (this.selectedContract === '' || job.type === this.selectedContract) &&
        (this.selectedCompany === '' || job.company === this.selectedCompany) // Filtre par société
    );
  }
  openModal(job: any) {
    this.isModalOpen = true;
  }

  // Fermer le modal
  closeModal() {
    this.isModalOpen = false;
    this.currentStep='form';
  }

  // Passer à l'étape suivante (Test)
  goToNextStep() {
    if (this.currentStep === 'form') {
      this.currentStep = 'test';
    } else if (this.currentStep === 'test') {
      this.currentStep = 'submit';
    }
  }
  goToPreviousStep() {
    if (this.currentStep === 'test') {
      this.currentStep = 'form';
    }
  }

  // Sélectionner le fichier CV
  onCvSelected(event: any) {
    this.applicant.cv = event.target.files[0];
  }

  // Soumettre la candidature
  submitApplication() {
    // Vérifier si les informations sont complètes
    if (!this.applicant.nomPrenom || !this.applicant.email || !this.applicant.telephone || !this.applicant.linkedin || !this.applicant.cv) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
  
    // Préparer les réponses au test sous forme de JSON
    const reponsesJson = JSON.stringify(this.selectedJob.testQuestions.map((q: any) => ({
      questionId: q.id,
      optionChoisieId: q.selectedOption !== null ? q.selectedOption : null  // Utilisez l'ID de l'option choisie
    })));
  
    // Créer un FormData pour envoyer la requête multipart/form-data
    const formData = new FormData();
    formData.append('OffreId', String(this.selectedJob.id));  // Assurez-vous que selectedJob a un ID
    formData.append('NomPrenom', this.applicant.nomPrenom);
    formData.append('Email', this.applicant.email);
    formData.append('Telephone', this.applicant.telephone);
    
    // Ajouter le fichier CV si un fichier est sélectionné
    if (this.applicant.cv) {
      formData.append('CVFile', this.applicant.cv, this.applicant.cv.name);  // Le fichier du CV
    }
  
    formData.append('LinkedIn', this.applicant.linkedin);
    formData.append('ReponsesJson', reponsesJson);  // Ajouter les réponses au test
  
    // Envoyer la requête POST
    fetch('http://localhost:5053/api/Candidature/soumettre-candidature', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        this.router.navigate(['/postuler']);  
      })
      .catch((error) => {
        console.error('Erreur lors de la soumission:', error);
        alert('Une erreur est survenue.');
      });
  }
  

showJobDetails(job: any) {
  this.selectedJob = job;
}


postuler(job: any) {
  // Rediriger vers le composant postuler avec les détails du job
  this.router.navigate(['/candidat/postuler'], { queryParams: { title: job.title } });
}
}
