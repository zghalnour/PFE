import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
// Assurez-vous d'importer DomSanitizer si ce n'est pas déjà fait
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
// Vous devrez installer pdf-lib: npm install pdf-lib
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
export interface AideDetail {
  type: 'info' | 'qrCode' | 'event' | 'invitation' | 'stepByStepGuide' | 'signContractPdf'; // Nouveau type ajouté
  textePrincipal: string; // Description principale de l'aide
  lienUrl?: string; // URL pour les liens
  qrCodeData?: string; // Données pour générer un QR code (ex: URL d'enregistrement)
  invitationPlatform?: string; // Plateforme d'invitation (ex: 'GitHub', 'Jira')
  evenement?: { // Détails si c'est un événement
    date: string;
    lieu: string;
    descriptionAdditionnelle?: string;
  };
steps?: Step[];
  ressourcesSecondaires?: { titre: string; lienUrl: string }[]; // Liens additionnels
  contractUrl?: string; // URL du contrat PDF à signer
}
export interface IntegrationTask {
  id: string; // Un identifiant unique pour la tâche
  titre: string; // Ex: "Inscription dans le système"
  description?: string; // Plus de détails si nécessaire
  estComplete: boolean;
  ordre?: number; 
  aideDetails?: AideDetail;
}
export interface Step {
  titreEtape: string;
  descriptionEtape: string;
  imageUrlEtape?: string;
  imageWasSubmitted?: boolean; // Useful if you later want step-specific submission UI changes
}
@Component({ // Assurez-vous que ViewChild et ElementRef sont importés si vous utilisez le canvas
  selector: 'app-integration',
  templateUrl: './integration.component.html',
  styleUrl: './integration.component.css'
})
export class IntegrationComponent implements OnInit { // Assurez-vous que ViewChild et ElementRef sont importés si vous utilisez le canvas
  // Utilisez un type string ou number consistent pour l'ID de l'employé
  employeId: string = 'defaultEmployee'; // Valeur par défaut ou chargée depuis l'authentification

  // Méthode pour charger l'ID de l'employé (à adapter selon votre système d'authentification)
  private loadEmployeeId(): void {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      this.employeId = storedUserId; // Assurez-vous que 'userId' dans localStorage est le bon ID
    }
  }
private defaultTasks: IntegrationTask[] = [

    {
      id: '1',
      titre: 'Inscription dans la pointeuse',
      estComplete: false,
      ordre: 1,
      aideDetails: {
        type: 'stepByStepGuide',
        textePrincipal: 'Pour finaliser votre inscription au système de pointage, merci de prendre une photo claire de votre visage. Cette photo sera utilisée uniquement pour l’identification biométrique lors de vos pointages.',
        steps: [
          {
            titreEtape: '1. Télécharger votre photo d\'identification',
            descriptionEtape: 'Veuillez sélectionner une image PNG claire de votre visage depuis votre ordinateur. Assurez-vous que votre visage est bien visible, centré, et que l\'éclairage est adéquat. Cette photo est essentielle pour l\'identification biométrique.',
            
          }
        ],
      }
    },
    {
      id: '2', 
      titre: 'Apprendre les notions de sécurité',
      estComplete: false,
      ordre: 2, // Place it after the first task
      aideDetails: {
        type: 'info', // Type d'aide simple
        textePrincipal: 'Familiarisez-vous avec les politiques et procédures de sécurité de l\'entreprise. Consultez les documents disponibles sur l\'intranet ou demandez à votre responsable.',
      }
    },
    {
      id: '3', // Nouveau ID unique
      titre: 'Récupérer le matériel',
      estComplete: false,
      ordre: 3, // Place it after the sécurité task
      aideDetails: {
        type: 'info', // Type d'aide simple
        textePrincipal: 'Rendez-vous au service informatique ou au bureau désigné pour récupérer votre ordinateur portable, votre téléphone professionnel et tout autre équipement nécessaire.',
        // Vous pourriez ajouter ici un lien ou des détails d'événement si applicable
        // lienUrl: 'URL vers la page du service informatique',
        // evenement: { date: '...', lieu: '...' }
      }
    }
    // Add other default tasks here if needed

  
  ];

   constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

   tasks: IntegrationTask[] = [];
   selectedTaskForHelp: IntegrationTask | null = null; 
   ngOnInit(): void {
    this.loadEmployeeId(); // Charge l'ID de l'employé avant de charger les tâches
    this.loadTasks();
  }

  // Propriétés pour la gestion de la signature (pour le type signContractPdf)
  signatureImageUrl: string | ArrayBuffer | null = null;
  signatureImageFile: File | null = null; // Pour stocker le fichier image de la signature
  // Pour le canvas (si vous choisissez cette option)
  // @ViewChild('signatureCanvas') signatureCanvasRef: ElementRef<HTMLCanvasElement>;
  // drawnSignatureDataUrl: string | null = null;

  private saveTasksToLocalStorage(): void {
    const userSpecificTasksStorageKey = `integration_tasks_${this.employeId}`; // Utilise l'ID chargé
    localStorage.setItem(userSpecificTasksStorageKey, JSON.stringify(this.tasks));
    // console.log('Tasks saved to localStorage'); // Optional: for debugging
  }

   loadTasks(): void {
    const userSpecificTasksStorageKey = `integration_tasks_${this.employeId}`;
    const storedUserTasksJson = localStorage.getItem(userSpecificTasksStorageKey);
    let userProgressMap: { [id: string]: boolean } = {};
    let storedAideDetailsMap: { [id: string]: AideDetail | undefined } = {};

    if (storedUserTasksJson) {
      const storedTasks: IntegrationTask[] = JSON.parse(storedUserTasksJson);
      storedTasks.forEach(task => {
        userProgressMap[task.id] = task.estComplete;
        // Conserver les aideDetails (qui peuvent contenir imageUrlEtape) des tâches stockées
        if (task.aideDetails) {
          storedAideDetailsMap[task.id] = task.aideDetails;
        }
      });
    }

    this.tasks = this.defaultTasks.map(defaultTask => {
      const estComplete = userProgressMap[defaultTask.id] || false;
      let resultingAideDetails: AideDetail | undefined = undefined;

      if (defaultTask.aideDetails) {
        // If defaultTask.aideDetails exists, create a new object based on it.
        // This ensures 'type' and 'textePrincipal' are present and correctly typed.
        resultingAideDetails = {
          ...defaultTask.aideDetails, // Spread all properties from default
        };

        const storedDetailsForThisTask = storedAideDetailsMap[defaultTask.id];

        // Now, specifically merge the 'steps' if they exist in both default and stored
        // and ensure resultingAideDetails is not undefined (which it isn't if we are in this block)
        if (defaultTask.aideDetails.steps && storedDetailsForThisTask?.steps) {
          // We need to make sure resultingAideDetails.steps is a new array
          resultingAideDetails.steps = defaultTask.aideDetails.steps.map((defaultStep, index) => {
            const storedStep = storedDetailsForThisTask.steps?.[index];
            if (storedStep) {
              return {
                ...defaultStep, // Start with default step properties
                // Override with stored properties if they exist
                ...(storedStep.imageUrlEtape !== undefined && { imageUrlEtape: storedStep.imageUrlEtape }),
                ...(storedStep.imageWasSubmitted !== undefined && { imageWasSubmitted: storedStep.imageWasSubmitted }),
              };
            }
            return defaultStep; // If no corresponding stored step, use the default
          });
        } else if (defaultTask.aideDetails.steps) {
            // If there are default steps but no stored steps, ensure we use a copy of default steps
            resultingAideDetails.steps = [...defaultTask.aideDetails.steps];
        } // If defaultTask.aideDetails.steps is undefined, resultingAideDetails.steps will also be undefined (from the initial spread)
      }

      return {
        ...defaultTask,
        estComplete: estComplete,
        aideDetails: resultingAideDetails, // This will be AideDetail or undefined
      };
    });

    this.saveTasksToLocalStorage();
    this.tasks.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }

    updateTaskStatus(taskId: string, estComplete: boolean): Observable<IntegrationTask | null> {
    const taskToUpdate = this.tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      taskToUpdate.estComplete = estComplete; // Mettre à jour dans la liste en mémoire (this.tasks)

      // Sauvegarder l'intégralité du tableau this.tasks mis à jour dans localStorage.
      // Ce tableau a été construit à partir de defaultTasks et inclut la dernière progression.
      this.saveTasksToLocalStorage();
      return of(taskToUpdate);
    }
    return of(null); // Tâche non trouvée
  }

  onTaskToggle(task: IntegrationTask): void {
    // L'état est déjà mis à jour par [(ngModel)] ou (change) dans le template,
    // ici on appelle la méthode pour persister le changement.
    this.updateTaskStatus(task.id, task.estComplete)
      .subscribe({
        next: updatedTask => {
          if (updatedTask) {
            console.log(`Tâche '${updatedTask.titre}' mise à jour.`);
          } else {
            console.error(`Erreur lors de la mise à jour de la tâche ${task.id}`);
            // Revert UI change if backend update failed
            task.estComplete = !task.estComplete;
          }
        },
        error: err => {
          console.error('Erreur lors de la mise à jour de la tâche:', err);
          // Revert UI change
          task.estComplete = !task.estComplete;
        }
      });
  }
  get progressPercentage(): number {
    if (this.tasks.length === 0) return 0;
    const completedTasks = this.tasks.filter(task => task.estComplete).length;
    return Math.round((completedTasks / this.tasks.length) * 100);
  }
   showHelp(task: IntegrationTask): void {
    this.selectedTaskForHelp = task;
  }

  // Nouvelle méthode pour fermer le panneau d'aide
  closeHelpPanel(): void {
    this.selectedTaskForHelp = null;
  }

  handleStepImageUpload(event: Event, taskForImage: IntegrationTask, stepIndex: number): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files[0]) {
      const file = inputElement.files[0];
      if (file.type === 'image/png') {
        const reader = new FileReader();
        reader.onload = () => {
          const taskToUpdate = this.tasks.find(t => t.id === taskForImage.id);
          if (taskToUpdate && taskToUpdate.aideDetails?.steps && taskToUpdate.aideDetails.steps[stepIndex]) {
            // Pour s'assurer que la détection de changement Angular fonctionne bien,
            // il est parfois préférable de créer une nouvelle référence pour l'objet step ou l'array steps.
            const newSteps = [...taskToUpdate.aideDetails.steps]; // Crée une copie du tableau des étapes
            newSteps[stepIndex] = { ...newSteps[stepIndex], imageUrlEtape: reader.result as string }; // Met à jour l'étape spécifique
            
            // Crée une nouvelle référence pour aideDetails pour aider à la détection des changements
            taskToUpdate.aideDetails = { ...taskToUpdate.aideDetails, steps: newSteps };
            
            this.saveTasksToLocalStorage(); // Save changes
            console.log(`Image updated for task '${taskToUpdate.titre}', step ${stepIndex + 1}`);
            
            // Si la tâche actuellement sélectionnée pour l'aide est celle mise à jour,
            // on la réassigne pour forcer la mise à jour de la vue du panneau d'aide.
            if (this.selectedTaskForHelp && this.selectedTaskForHelp.id === taskToUpdate.id) {
              this.selectedTaskForHelp = { ...taskToUpdate }; // Crée une nouvelle référence pour selectedTaskForHelp
            }
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          alert('Erreur lors de la lecture du fichier.');
        };
        reader.readAsDataURL(file);
      } else {
        alert('Veuillez sélectionner un fichier au format PNG.');
        inputElement.value = ''; // Reset file input to allow re-selection of the same file if needed after error
      }
    }
  }

  submitImage(): void {
    if (this.selectedTaskForHelp) {
     const taskToComplete = this.selectedTaskForHelp; // Keep a reference for use in async callback
      this.updateTaskStatus(taskToComplete.id, true).subscribe({
        next: () => {
          console.log(`Tâche "${taskToComplete.titre}" marquée comme complétée.`);

          // Find the index of the completed task in the sorted list
          const currentIndex = this.tasks.findIndex(task => task.id === taskToComplete.id);

          if (currentIndex !== -1 && currentIndex < this.tasks.length - 1) {
            // There is a next task in the list
            const nextTask = this.tasks[currentIndex + 1];
            this.showHelp(nextTask); // Display help for the next task
          } else {
            // This was the last task, or task not found (though it should be found if taskToComplete was valid)
            console.log('Ceci était la dernière tâche ou toutes les tâches avec aide sont complétées.');
            this.closeHelpPanel(); // Close the help panel
          }
        },
        error: (err) => {
          console.error(`Erreur lors de la tentative de marquer la tâche "${taskToComplete.titre}" comme complétée:`, err);
          // Consider if task.estComplete needs to be reverted if updateTaskStatus doesn't handle it
        }
      });
    } else {
      console.error('Aucune tâche sélectionnée pour marquer comme terminée après l\'envoi de l\'image.');
    }
  }

  // Méthodes pour la signature de PDF
  getSafeContractUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  handleSignatureImageUpload(event: any): void {
    const file = event.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      this.signatureImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.signatureImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Veuillez sélectionner une image PNG ou JPG pour la signature.');
      this.signatureImageFile = null;
      this.signatureImageUrl = null;
    }
  }

  async submitSignedContract(): Promise<void> {
    if (!this.selectedTaskForHelp || !this.selectedTaskForHelp.aideDetails?.contractUrl) {
      console.error("Aucune tâche sélectionnée ou URL de contrat manquante.");
      alert("Erreur : Impossible de trouver le contrat à signer.");
      return;
    }

    if (!this.signatureImageFile) {
      alert("Veuillez télécharger une image de votre signature.");
      return;
    }

    try {
      // 1. Charger le PDF original
      const existingPdfBytes = await fetch(this.selectedTaskForHelp.aideDetails.contractUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      // Ciblez une page spécifique, par exemple la dernière ou une page avec un champ de signature prédéfini
      const targetPage = pages[pages.length - 1]; 

      // 2. Charger l'image de la signature
      const signatureImageBytes = await this.signatureImageFile.arrayBuffer();
      let signatureImage;
      if (this.signatureImageFile.type === 'image/png') {
        signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      } else if (this.signatureImageFile.type === 'image/jpeg') {
        signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
      } else {
        alert("Format d'image de signature non supporté.");
        return;
      }
      
      // 3. Redimensionner et positionner la signature (ajustez ces valeurs)
      const signatureDims = signatureImage.scale(0.3); // Réduire la taille de la signature à 30%
      targetPage.drawImage(signatureImage, {
        x: 50, // Position X (depuis le coin inférieur gauche)
        y: 100, // Position Y
        width: signatureDims.width,
        height: signatureDims.height,
      });

      // 4. Sauvegarder le PDF modifié en bytes
      const pdfBytes = await pdfDoc.save();

      // 5. Envoyer le PDF au serveur
      const formData = new FormData();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      // Nommez le fichier de manière significative
      const fileName = `contrat_signe_${this.selectedTaskForHelp.id}_${this.employeId}.pdf`; // Utilise l'ID chargé
      formData.append('signedContract', pdfBlob, fileName);
      formData.append('taskId', this.selectedTaskForHelp.id);
      // formData.append('employeeId', this.employeeId); // Si nécessaire pour votre backend

      // Remplacez '/api/upload-signed-contract' par votre véritable endpoint
      this.http.post('/api/upload-signed-contract', formData).subscribe({
        next: (response) => {
          console.log('Contrat signé envoyé avec succès:', response);
          alert('Contrat signé et envoyé !');
          // Marquer la tâche comme complétée et passer à la suivante
          this.updateTaskStatus(this.selectedTaskForHelp!.id, true).subscribe(() => {
            const currentIndex = this.tasks.findIndex(task => task.id === this.selectedTaskForHelp!.id);
            if (currentIndex !== -1 && currentIndex < this.tasks.length - 1) {
              this.showHelp(this.tasks[currentIndex + 1]);
            } else {
              this.closeHelpPanel();
            }
            // Réinitialiser l'état de la signature pour la prochaine fois
            this.signatureImageFile = null;
            this.signatureImageUrl = null;
          });
        },
        error: (err) => {
          console.error("Erreur lors de l'envoi du contrat signé:", err);
          alert("Erreur lors de l'envoi du contrat. Veuillez réessayer.");
        }
      });
    } catch (err) {
      console.error('Erreur lors de la modification du PDF:', err);
      alert("Une erreur s'est produite lors de la préparation du document pour signature.");
    }
  }
}
