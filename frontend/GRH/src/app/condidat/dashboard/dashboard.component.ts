import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewChecked {

  isLoading: boolean = false;
  isModalOpen: boolean = false;
  currentStep: string = 'form';

  searchQuery: string = '';
  selectedContract: string = '';
  selectedCompany: string = '';

  contractTypes: string[] = ['CDI', 'CDD', 'NDA'];

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
  newMessage: string = '';
  chatMessages: { message: string; isUser: boolean }[] = [];
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  isChatExpanded: boolean = false; 

  constructor(private router: Router , private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.fetchJobs();
    this.scrollToBottom();
    if (this.filteredJobs().length > 0) {
      this.selectedJob = this.filteredJobs()[0];
    }
  }
  ngAfterViewChecked() {
    this.scrollToBottom();
  
  }
  onFilterChange() {
    // Quand un filtre est modifié, on met à jour le job sélectionné
    const filtered = this.filteredJobs();
    if (filtered.length > 0) {
      this.selectedJob = filtered[0];
    } else {
      this.selectedJob = null;
    }
  }
  
  toggleChat(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isChatExpanded = !this.isChatExpanded;
    if(this.isChatExpanded){
      this.scrollToBottom();
    }
  }
  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
  async fetchJobs() {
    try {
      const response = await fetch('http://localhost:5053/api/Offre/get-Ouv-offres');
      if (!response.ok) throw new Error('Erreur lors de la récupération des offres');
      
      const data = await response.json();
      this.jobs = data.map((job: any) => ({
        id:job.id,
        title: job.titre,
        type: job.typeContrat,
        skills: job.competences.split(/[,\;/\|\-]\s*/),
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
      const filtered = this.filteredJobs();
      if (filtered.length > 0) {
        this.selectedJob = filtered[0];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des offres :', error);
    }
  }
  // In dashboard.component.ts

// Dans dashboard.component.ts

isJobExpired(job: any): boolean {
  console.log('Vérification de l\'expiration pour le job:', job);

  if (!job || !job.deadline) {
    console.warn('Job ou job.deadline est manquant. Retourne false (non expiré par défaut).');
    return false;
  }

  console.log('Valeur brute de job.deadline:', job.deadline, '| Type:', typeof job.deadline);

  let deadlineDate: Date;
  const dateParts = String(job.deadline).split('/'); // S'assurer que c'est une chaîne avant de splitter

  // Vérifier si la date est au format DD/MM/YYYY et a 3 parties
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Mois en JS est 0-indexé (0 = Janvier, 11 = Décembre)
    const year = parseInt(dateParts[2], 10);
    
    // Vérifier si les parties sont des nombres valides
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      deadlineDate = new Date(year, month, day);
      console.log(`Date analysée manuellement (DD/MM/YYYY) comme: Année=${year}, Mois=${month + 1}, Jour=${day}`);
    } else {
      console.error('ERREUR: Les parties de job.deadline ne sont pas des nombres valides après le split. Tentative d\'analyse directe.');
      deadlineDate = new Date(job.deadline); // Tentative d'analyse directe en cas d'échec
    }
  } else {
    // Si le format n'est pas DD/MM/YYYY, essayer une analyse directe (peut échouer ou mal interpréter)
    console.warn('Format de job.deadline non reconnu comme DD/MM/YYYY. Tentative d\'analyse directe.');
    deadlineDate = new Date(job.deadline);
  }
  
  const currentDate = new Date();

  console.log('Date limite interprétée (deadlineDate):', deadlineDate.toString());
  console.log('Date actuelle (currentDate):', currentDate.toString());

  // Vérifier si deadlineDate est une date valide
  if (isNaN(deadlineDate.getTime())) {
    console.error('ERREUR: deadlineDate est une "Invalid Date". Vérifiez le format de job.deadline depuis l\'API ou la logique d\'analyse.');
    return true; // Considérer comme expiré si la date est invalide pour plus de sécurité
  }

  // S'assurer que la comparaison est juste : considérer la date limite valide pour toute la journée
  // Cette copie évite de modifier l'objet date original si ce n'est pas souhaité ailleurs
  const adjustedDeadlineDate = new Date(deadlineDate.valueOf());
  adjustedDeadlineDate.setHours(23, 59, 59, 999);
  console.log('Date limite ajustée (fin de journée):', adjustedDeadlineDate.toString());

  const isExpired = currentDate > adjustedDeadlineDate;
  console.log('L\'offre est-elle expirée ? (currentDate > adjustedDeadlineDate):', isExpired);

  return isExpired;
}


  sendMessage() {
    if (this.newMessage.trim() === '') return;

    this.chatMessages.push({ message: this.newMessage, isUser: true });
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*'
    });
    this.http.post<{ reply: string }>('http://localhost:5053/api/Chatbot/send-message', `"${this.newMessage}"`, { headers })
      .subscribe({
        next: (response) => {
          this.chatMessages.push({ message: response.reply, isUser: false });
          this.newMessage = '';
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.chatMessages.push({ message: 'Error sending message', isUser: false });
          this.newMessage = '';
        },
      });
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
  
    if (!this.applicant.nomPrenom || !this.applicant.email || !this.applicant.telephone || !this.applicant.linkedin || !this.applicant.cv ) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires et sélectionner un CV.', 'Fermer', {
        duration: 3000, 
        verticalPosition: 'top'
      });
      return;
    }
    this.isLoading = true;
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
         this.applicant = {
    offreId: 0, // ou this.selectedJob.id si tu veux garder la référence
    nomPrenom: '',
    email: '',
    telephone: '',
    linkedin: '',
    cv: null,
    reponses: []
  };

  // Réinitialiser les réponses aux questions
  if (this.selectedJob.testQuestions) {
    this.selectedJob.testQuestions.forEach((q: any) => {
      q.selectedOption = null;
    });
  }
        this.router.navigate(['/postuler']);  
      })
      .catch((error) => {
        console.error('Erreur lors de la soumission:', error);
        alert('Une erreur est survenue.');
      });
  }
  submitSimpleApplication() {
    if (!this.applicant.nomPrenom || !this.applicant.email || !this.applicant.telephone || !this.applicant.linkedin || !this.applicant.cv ) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires et sélectionner un CV.', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top'
      });
      return;
    }
    this.isLoading = true;

    const formData = new FormData();
    formData.append('OffreId', String(this.selectedJob.id));
    formData.append('NomPrenom', this.applicant.nomPrenom);
    formData.append('Email', this.applicant.email);
    formData.append('Telephone', this.applicant.telephone);
    formData.append('LinkedIn', this.applicant.linkedin);

    if (this.applicant.cv) {
      formData.append('CVFile', this.applicant.cv, this.applicant.cv.name);
    }

    fetch('http://localhost:5053/api/Candidature/soumettre-candidature-simple', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
         this.applicant = {
    offreId: 0, // ou this.selectedJob.id si tu veux garder la référence
    nomPrenom: '',
    email: '',
    telephone: '',
    linkedin: '',
    cv: null,
    reponses: []
  };

  // Réinitialiser les réponses aux questions
  if (this.selectedJob.testQuestions) {
    this.selectedJob.testQuestions.forEach((q: any) => {
      q.selectedOption = null;
    });
  }
        this.isLoading = false;
        this.router.navigate(['/postuler']);  
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Error:', error);
        alert('Une erreur est survenue lors de la soumission de la candidature.');
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
