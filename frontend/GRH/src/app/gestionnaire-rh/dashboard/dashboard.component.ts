import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { forkJoin } from 'rxjs'; // Import forkJoin if fetching multiple things at once
import { finalize } from 'rxjs/operators'; // Import finalize for loading indicators

export interface EntretienDateResponse {
  id: number;
  dateEntretien: string; 
}
export interface Candidature {
  id: number;
  statut: string; // Add statut
  nomOffre: string; // Add nomOffre
  nomPrenom: string;
  email: string;
  telephone: string;
  entretiens: Entretien[]; // Add entretiens
  nbEntretiens?: number | null;
  nbFixe?: boolean;
}

// In a file like entretien.model.ts or in your dashboard.ts if you don't have a separate model file
export interface Entretien {
  id: number;
  candidatureId?: number;
  typeEntretien: string;
  dateEntretien: Date;
  statut: string;
  commentaire: string;
  modeEntretien: string;
  responsableId?: number | null;
  responsableNom: string;
  showDecision?: boolean;
  decisionPrise?: boolean;


}
export interface Responsable {
  id: number;
  nomPrenom: string;
  role: string;
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  candidatures: Candidature[] = [];
  entretiens: { [candidatureId: number]: Entretien[] } = {};
  offres: string[] = [];
  selectedOffre: string = '';
  filteredCandidatures: Candidature[] = [];
  selectedCandidature: Candidature | null = null;
  searchTerm: string = '';
  responsables: Responsable[] = [];
  nouvelEntretien: Partial<Entretien> = { typeEntretien: '', dateEntretien: new Date() ,modeEntretien: '',responsableId: null};
  
  nombreEntretiens: number | null = null;// Total à planifier
nombreEntretiensPlanifies: number = 0; // Compteur de ceux terminés
 
bookedDateTimeSlots: Set<string> = new Set();
// Dates that have at least one booking (for the basic dateFilter)
datesWithBookings: Set<number> = new Set(); // Store UTC timestamps of dates
fullyBookedDates: Set<number> = new Set(); 

selectedDate: Date | null = null;
selectedTime: string = ''; // e.g., "09:30"

allPossibleTimeSlots: string[] = []; // All slots from 8h to 17h
availableTimeSlots: string[] = []; // Available slots for the selected date
selectedTypeOption: string = '';
isLoadingSlots: boolean = false
loggedInUser: any = null;
loggedInUserId: any = null;
  constructor(private http: HttpClient,private snackbar: MatSnackBar) {}

  ngOnInit(): void {
     this.loggedInUser = localStorage.getItem('userName'); // IMPORTANT: Use your actual localStorage key
      this.loggedInUserId=localStorage.getItem('userId');


    // Initialize or reset the form (if you have such a method)
    this.resetNouvelEntretienForm();
  
    this.loadCandidatures();
    this.loadResponsables();
    this.loadEntretiensForAllCandidatures();
    this.fetchBookedSlots();

    this.generateAllPossibleTimeSlots(); 
  }
    handleTypeChange(): void {
    if (this.selectedTypeOption === 'RH') {
      this.nouvelEntretien.typeEntretien = 'RH';
      if (this.loggedInUser) { // IMPORTANT: Ensure 'id' is the correct property for user ID
        this.nouvelEntretien.responsableId = this.loggedInUserId;
        this.nouvelEntretien.responsableNom = this.loggedInUser;
      } else {
        this.nouvelEntretien.responsableId = null; // Fallback if user or ID not found
        console.warn('Logged-in GRH user ID not available to auto-assign responsable.');
      }
    } else if (this.selectedTypeOption === 'Autre') {
      // When 'Autre' is selected, the input field will bind to nouvelEntretien.typeEntretien
      // Clear it initially to ensure user provides a new value
      this.nouvelEntretien.typeEntretien = '';
      this.nouvelEntretien.responsableId = null; // Allow user to select a responsable
    } else {
      // Handle cases where no option is selected (e.g., initial state if "Choisir..." is re-selectable)
      this.nouvelEntretien.typeEntretien = '';
      this.nouvelEntretien.responsableId = null;
    }
  }
    resetNouvelEntretienForm(): void {
    this.selectedTypeOption = ''; // Default to "Choisir..."
    // Or, if you want 'RH' to be the default:
    // this.selectedTypeOption = 'RH';

    this.nouvelEntretien = {
      typeEntretien: '',
      dateEntretien: undefined,
      responsableId: null,
      modeEntretien: 'Présentiel',
      // ... reset other properties of nouvelEntretien
    };
    this.selectedDate = null;
    this.selectedTime = '';
    this.availableTimeSlots = [];

    // If you have a default selectedTypeOption (e.g. 'RH'), call handleTypeChange to set initial state
    if (this.selectedTypeOption) {
         this.handleTypeChange();
    }
  }

  fetchBookedSlots(): void {
    const apiUrl = 'http://localhost:5053/api/Entretien/dates';
    // Calculer le nombre total de créneaux possibles une seule fois si allPossibleTimeSlots est prêt
    const totalPossibleSlots = this.allPossibleTimeSlots.length;
    if (totalPossibleSlots === 0) {
        console.warn("Impossible de déterminer les jours complets car allPossibleTimeSlots est vide.");
        // Peut-être appeler generateAllPossibleTimeSlots() ici si ce n'est pas garanti avant
    }
  

    this.http.get<EntretienDateResponse[]>(apiUrl).subscribe({
      next: (bookedInterviews) => {
        this.bookedDateTimeSlots.clear();
        this.datesWithBookings.clear();
        this.fullyBookedDates.clear(); // <-- NOUVEAU: Vider l'ensemble des jours complets

        // Map temporaire pour compter les réservations par jour (timestamp UTC)
        const bookingsPerDay = new Map<number, number>();

        bookedInterviews.forEach(interview => {
          const dateStringFromApi = interview.dateEntretien;
          const match = dateStringFromApi.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);

          if (match) {
            const datePart = match[1];
            const timePart = match[2];
            const dateTimeString = `${datePart}T${timePart}`;
            this.bookedDateTimeSlots.add(dateTimeString);

            // Calculer le timestamp UTC du jour pour le comptage
            try {
                // Utiliser les parties extraites pour être cohérent
                const [year, month, day] = datePart.split('-').map(Number);
                // Mois dans Date.UTC est 0-indexé
                const dayTimestamp = Date.UTC(year, month - 1, day);
                this.datesWithBookings.add(dayTimestamp); // Ajoute au set des jours ayant au moins une résa

                // Incrémenter le compteur pour ce jour
                bookingsPerDay.set(dayTimestamp, (bookingsPerDay.get(dayTimestamp) || 0) + 1);

            } catch (e) {
                console.error("Error parsing date for dayTimestamp:", dateStringFromApi, e);
            }
          } else {
            console.warn(`Could not parse date/time string from API: ${dateStringFromApi}`);
          }
        });

        // --- NOUVEAU: Identifier les jours complets ---
        if (totalPossibleSlots > 0) {
            bookingsPerDay.forEach((count, dayTimestamp) => {
                // Si le nombre de réservations est >= au total possible, marquer comme complet
                if (count >= totalPossibleSlots) {
                    this.fullyBookedDates.add(dayTimestamp);
                }
            });
        }
        // --- Fin Nouveau ---

        console.log('Booked DateTime Slots (Parsed Directly):', this.bookedDateTimeSlots);
        console.log('Dates with any booking (UTC Timestamps):', this.datesWithBookings);
        console.log('Fully Booked Dates (UTC Timestamps):', this.fullyBookedDates); // <-- NOUVEAU: Log

        // Rafraîchir si une date est déjà sélectionnée (ne devrait plus être nécessaire si le filtre fonctionne)
        // if (this.selectedDate) {
        //     this.filterAvailableTimeSlotsForDate(this.selectedDate);
        // }
      },
      error: (err) => {
        console.error('Error fetching booked slots:', err);
        this.bookedDateTimeSlots.clear();
        this.datesWithBookings.clear();
        this.fullyBookedDates.clear(); // <-- NOUVEAU: Vider aussi en cas d'erreur
        this.snackbar.open('Erreur lors de la récupération des créneaux réservés.', 'Fermer', { duration: 3000 });
      }
    });
  }


  generateAllPossibleTimeSlots(): void {
    this.allPossibleTimeSlots = [];
    const startHour = 8;
    const endHour = 16;
    const intervalMinutes = 30; // Or 60 for full hours

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (hour === endHour && minute > 0) continue; // Stop at 17:00 sharp

        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        this.allPossibleTimeSlots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
     // console.log('All possible slots (8h-17h):', this.allPossibleTimeSlots);
  }

  dateFilter = (d: Date | null): boolean => {
    if (!d) {
      return true; // Permettre la sélection vide
    }
    // Obtenir le timestamp UTC de minuit pour la date à vérifier
    const time = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

    // Retourner true (activé) si la date N'EST PAS dans l'ensemble des dates complètes
    // Retourner false (désactivé) si la date EST dans l'ensemble des dates complètes
    return !this.fullyBookedDates.has(time);
  };


  // Optional: Reset time if the date changes
  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.selectedDate = event.value;
    this.selectedTime = ''; // Reset time selection
    this.availableTimeSlots = []; // Clear previous slots

    if (this.selectedDate) {
      console.log('Date selected (local):', this.selectedDate);
      this.isLoadingSlots = true; // Indicate we are processing
      // Use setTimeout to allow UI to update (show spinner) before heavy filtering
      setTimeout(() => {
          this.filterAvailableTimeSlotsForDate(this.selectedDate!);
          this.isLoadingSlots = false;
      }, 50); // Small delay
    }
  }
  
  filterAvailableTimeSlotsForDate(date: Date): void {
    if (!date) return;

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const selectedDateString = `${year}-${month}-${day}`; // YYYY-MM-DD format from local date

    console.log(`Filtering available slots for date (local): ${selectedDateString}`);

    this.availableTimeSlots = this.allPossibleTimeSlots.filter(timeSlot => {
        // Construct the full UTC DateTime string to check against the booked slots
        // We assume the selected time (e.g., "09:00") should be treated as UTC
        // when comparing with the stored booked slots (which we also stored as UTC).
        const dateTimeToCheck = `${selectedDateString}T${timeSlot}`;
        const isBooked = this.bookedDateTimeSlots.has(dateTimeToCheck);
        // console.log(`Checking slot ${dateTimeToCheck}: Booked = ${isBooked}`); // Debug line
        return !isBooked; // Keep the slot if it's NOT in the booked set
    });

    console.log(`Available slots for ${selectedDateString}:`, this.availableTimeSlots);

    // Optional: If no slots are available, show a message
    if (this.availableTimeSlots.length === 0 && this.selectedDate) {
        this.snackbar.open(`Aucun créneau disponible entre 8h et 17h pour le ${selectedDateString}.`, 'Fermer', { duration: 4000 });
    }
  }
  calendarCellClass = (date: Date): string => {
    if (!date) {
      return '';
    }
    // Obtenir le timestamp UTC de minuit pour la date à vérifier
    const time = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

    // Si la date EST dans l'ensemble des dates complètes, retourner la classe CSS
    if (this.fullyBookedDates.has(time)) {
      return 'fully-booked-date'; // Le nom de la classe CSS définie
    }

    // Sinon, ne retourner aucune classe spéciale
    return '';
  };

  // Method to combine date and time before saving
  private combineDateTime(): Date | null {
    console.log('Date received in combineDateTime:', this.selectedDate); // LOG 6
    if (this.selectedDate && this.selectedTime) {
      try {
        const [hours, minutes] = this.selectedTime.split(':').map(Number);
  
        // --- Modification ici ---
        // Récupérer les composants de la date sélectionnée (qui est locale)
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth(); // Mois est 0-indexé (0 = Janvier)
        const day = this.selectedDate.getDate();
  
        // Créer une nouvelle date directement avec les composants UTC
        // Date.UTC retourne un timestamp (nombre), new Date() le convertit en objet Date
        const combinedUtcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
        // --- Fin de la modification ---
  
        console.log('Date created using UTC components:', combinedUtcDate); // <-- Vérifiez cette sortie
        console.log('ISO String (UTC) being sent:', combinedUtcDate.toISOString()); // <-- Vérifiez cette sortie
  
        // Retourne l'objet Date qui représente maintenant le bon moment en UTC
        return combinedUtcDate;
  
      } catch (e) {
        console.error("Error parsing time or creating UTC date:", e);
        return null;
      }
    }
    return null;
  }

  loadResponsables(): void {
    this.http.get<Responsable[]>('http://localhost:5053/api/Employe/getAllEmployes').subscribe({
      next: (data) => {
        // Vous pouvez filtrer ici si seuls certains postes peuvent être responsables
        // Exemple : this.responsables = data.filter(emp => emp.poste === 'Manager' || emp.poste === 'Chef Informatique');
        this.responsables = data; // Pour l'instant, on prend tous les employés
        console.log('Responsables (Employés) chargés:', this.responsables);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des responsables (Employés):', error);
      }
    });
  }
  genererFormulaires() {
    
    this.nombreEntretiensPlanifies = 0;
    const apiUrl = `http://localhost:5053/api/Candidature/updateNbEntretiens/${this.selectedCandidature!.id}/${this.nombreEntretiens}`;
  
    this.http.put(apiUrl, {}).subscribe({
      next: (response) => {
        // ... other success logic ...
        if (this.selectedCandidature) {
          this.selectedCandidature.nbEntretiens = this.nombreEntretiens;
          // Update nbFixe based on the new value
          this.selectedCandidature.nbFixe = (this.nombreEntretiens !== null && this.nombreEntretiens > 0);
        }
        // Update the main list as well
        const index = this.candidatures.findIndex(c => c.id === this.selectedCandidature!.id);
        if (index > -1) {
           this.candidatures[index].nbEntretiens = this.nombreEntretiens;
           this.candidatures[index].nbFixe = (this.nombreEntretiens !== null && this.nombreEntretiens > 0);
        }
        // ...
      },
      // ... error handling ...
    }
    );
  
    this.loadCandidatures();

    
  
  }
  loadCandidatures(): void {

    this.http.get<Candidature[]>('http://localhost:5053/api/Candidature/getAllCandidatures').subscribe({
      next: (data) => {
        const filteredData = data.filter(candidature => candidature.statut !== 'RefusePreSelection'&& candidature.statut !== 'En cours');

        // 2. Map over the FILTERED data to add nbFixe
        this.candidatures = filteredData.map(c => ({
          ...c, // Copy existing properties
          // Set nbFixe based on nbEntretiens value
          nbFixe: (c.nbEntretiens !== null && c.nbEntretiens !== undefined && c.nbEntretiens > 0)
        }));
        this.extractOffres();
        this.filterCandidatures();
        this.loadEntretiensForAllCandidatures();
      },
      error: (error) => {
        console.error('Error fetching candidatures:', error);
        
      },
    });
  }
  loadEntretiensForAllCandidatures(): void {
    this.candidatures.forEach((candidature) => {
      this.loadEntretiens(candidature.id);
    });
  }
  get FnombreEntretiensPlanifies(): number {
    if (!this.selectedCandidature) {
      return 0;
    }
    const entretiensCandidature = this.entretiens[this.selectedCandidature.id] || [];
    return entretiensCandidature.filter(e => e.statut === 'Passé' || e.statut === 'Echoué').length;
  }
  

  loadEntretiens(candidatureId: number): void {
    this.http
      .get<Entretien[]>(`http://localhost:5053/api/Candidature/${candidatureId}/entretiens`)
      .subscribe({
        next: (data) => {
          this.entretiens[candidatureId] = data.map(entretien => ({
            ...entretien,
            date: new Date(entretien.dateEntretien),
            showDecision: false,
            decisionPrise: entretien.statut === 'En cours' ? false : true,
            
          
          }));
          if (this.selectedCandidature?.id === candidatureId) {
            
            // Recalculate the count of planned/completed interviews for the selected candidate
            this.nombreEntretiensPlanifies = this.entretiens[this.selectedCandidature!.id]
            .filter((e: any) => e.statut !== 'En cours')
            .length;
            console.log(this.nombreEntretiensPlanifies);
          
          }

        },
        error: (error) => {
          console.error(`Error fetching entretiens for candidature ${candidatureId}:`, error);
        },
      });
  }




  extractOffres(): void {
    this.offres = [...new Set(this.candidatures.map((candidature) => candidature.nomOffre))];
  }

  filterCandidatures(): void {
    this.filteredCandidatures = this.candidatures.filter((candidature) => {
      return this.selectedOffre ? candidature.nomOffre === this.selectedOffre : true;
    });
  }
    isNewInterviewCreationDisabled(): boolean {
    if (!this.selectedCandidature || !this.entretiens[this.selectedCandidature.id]) {
      return false; // No candidate selected or no interviews for this candidate
    }
    // Check if any interview for the selected candidate has the status 'En cours'
    return this.entretiens[this.selectedCandidature.id].some(entretien => entretien.statut === 'En cours');
  }
  creerEntretien(): void {
    console.log('ID Responsable sélectionné avant création:', this.nouvelEntretien.responsableId); // <-- AJOUTE CECI
  
    // Validate that a candidate is selected, a type is chosen, and both date and time have been picked
    if (!this.selectedCandidature || 
        !this.nouvelEntretien.typeEntretien || 
        !this.selectedDate ||  // Check selectedDate directly
        !this.selectedTime) { // Check selectedTime directly
      console.warn('Creation d\'entretien annulée: des informations requises sont manquantes (candidature, type, date ou heure).');
      return;
    }
    console.log('Date before combining:', this.selectedDate); // <-- LOG 2
    console.log('Time before combining:', this.selectedTime); // <-- LOG 3
  
    const combinedDateTime = this.combineDateTime();
    console.log('Combined DateTime:', combinedDateTime); // <-- LOG 4

    if (!combinedDateTime) {
        console.error('A valid date and time must be selected.');
        return;
    }
  
  
    const year = this.selectedDate!.getFullYear();
    const month = (this.selectedDate!.getMonth() + 1).toString().padStart(2, '0');
    const day = this.selectedDate!.getDate().toString().padStart(2, '0');
    const selectedDateString = `${year}-${month}-${day}`;
    const dateTimeToCheck = `${selectedDateString}T${this.selectedTime}`;

    if (this.bookedDateTimeSlots.has(dateTimeToCheck)) {
        this.snackbar.open('Ce créneau vient d\'être réservé. Veuillez en choisir un autre.', 'Fermer', { duration: 4000 });
        // Refresh available slots for the user
        this.filterAvailableTimeSlotsForDate(this.selectedDate!);
        return;
    }
    const entretienData = {
      candidatureId: this.selectedCandidature.id,
      typeEntretien: this.nouvelEntretien.typeEntretien,
      modeEntretien: this.nouvelEntretien.modeEntretien,
      dateEntretien: combinedDateTime.toISOString(),
      responsableId: this.nouvelEntretien.responsableId 
    };
    console.log('entretienData:', entretienData);
  
    this.http.post<number>('http://localhost:5053/api/Entretien/add', entretienData,)
      .subscribe({
        next: (newEntretienId) => {
          console.log('New entretien created with ID:', newEntretienId);
          // Update the local list of entretiens
          this.loadEntretiens(this.selectedCandidature!.id);
        
          this.updateCandidatureStatus(
            this.selectedCandidature!.id,
            `Entretien${this.nouvelEntretien.typeEntretien}Programmé`
          );
          this.nouvelEntretien = { typeEntretien: '', dateEntretien: new Date(), modeEntretien: 'présentiel',responsableId: null };
          
        
        },
        error: (error) => {
          console.error('Error creating entretien:', error);
        },
      });
    
  
    
  }

  updateEntretien(entretien: Entretien, status: 'Passé' | 'Echoué'): void {
    entretien.statut = status;
   entretien.decisionPrise = true;

    
    const entretienData = {
      commentaire: entretien.commentaire,
      statut: entretien.statut,
    };
    console.log('entretienData:', entretienData);
    console.log('entretien.id:', entretien.id);
    this.http.put<Entretien>(`http://localhost:5053/api/Entretien/update/${entretien.id}`, entretienData).subscribe({
      next: (updatedEntretien) => {
        console.log('entretien updated:', updatedEntretien);
        if (updatedEntretien.candidatureId) {
        
          this.loadEntretiens(updatedEntretien.candidatureId);
          const newStatus = `Entretien${entretien.typeEntretien}${status === 'Passé' ? 'Accepté' : 'Refusé'}`;
        
          this.updateCandidatureStatus(
            updatedEntretien.candidatureId,
            newStatus // Use the corrected newStatus
          );
        }
      
        entretien.showDecision = true;
        this.loadEntretiensForAllCandidatures();
      },
      error: (error) => {
        console.error('Error updating entretien:', error);
      },
    });
    this.nombreEntretiensPlanifies = this.entretiens[this.selectedCandidature!.id]
    .filter((e: any) => e.statut === 'Passé' || e.statut === 'Echoué')
    .length;
  }

  updateCandidatureStatus(candidatureId: number, newStatus: string): void {
    this.http
      .put<any>(
        `http://localhost:5053/api/Candidature/modifier-statut/${candidatureId}/${newStatus}`,
        {}
      )
      .subscribe({
        next: (response) => {
          console.log(
            `Candidature ${candidatureId} status updated to ${newStatus}`,
            response
          );
          this.loadCandidatures();
        },
        error: (error) => {
          console.error(
            `Error updating candidature ${candidatureId} status:`,
            error
          );
        },
      });
  }


  openModal(candidature: Candidature): void {
    this.selectedCandidature = candidature;
    this.nombreEntretiens = candidature.nbEntretiens ?? null;
    this.loadCandidatures();
    this.selectedDate = null;
    this.selectedTime = '';
  }


  closeModal(): void {
    this.selectedCandidature = null;
  
  }
  planifierEntretien(entretien: Entretien): void {
    entretien.statut = 'En cours';
  }

  
  toggleDecision(entretien: any) {
    entretien.showDecision = !entretien.showDecision;
  
    
  }
  formatDate(date: Date | string): string {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString('fr-FR');
  }
  
  notifyAdmin(candidature: Candidature): void {
    console.log('Tentative de notification pour la candidature:', candidature.id);

    // --- IMPORTANT ---
    // Replace '1' with the actual logic to get the Admin's UtilisateurId.
    // This might come from a configuration service, user service, or be a known constant.
    const adminUserId = 1; // <<< REMPLACEZ CECI PAR LA VRAIE LOGIQUE D'OBTENTION DE L'ID ADMIN

    if (!adminUserId) {
        console.error("Impossible de déterminer l'ID de l'administrateur destinataire.");
        // Optionnel: Afficher un message d'erreur à l'utilisateur
        // this.snackbar.open('Erreur: ID Administrateur non trouvé.', 'Fermer', { duration: 3000 });
        return; // Stop execution if admin ID is not found
    }

    // Prepare the data according to the backend's CreateNotificationRequest model
    const notificationRequest = {
      UtilisateurId: adminUserId, // Use the determined Admin User ID
      CandidatureId: candidature.id
    };

    // Use the correct API endpoint URL provided by your backend
    const apiUrl = 'http://localhost:5053/api/Notif/createNotificationForAdmin'; // Corrected endpoint

    this.http.post(apiUrl, notificationRequest) // Send the correct request object
      .subscribe({
        next: (response: any) => { // Type the response if you know its structure, e.g., { message: string }
          console.log('Notification envoyée avec succès. Réponse serveur:', response);
          // Optionnel : Afficher un message de succès à l'utilisateur (ex: Snackbar)
           const successMessage = response?.message || 'Notification envoyée à l\'administrateur.';
           this.snackbar.open(`✔️ ${successMessage}`, 'OK', { // Ou utilisez une icône mat-icon si vous créez un composant snackbar personnalisé
            duration: 3500, // Durée légèrement augmentée
            panelClass: ['success-snackbar'] // Utilise la classe CSS de succès
           });
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi de la notification:', error);
          // Optionnel : Afficher un message d'erreur plus détaillé
           const errorMessage = error?.error?.message || 'Erreur lors de l\'envoi de la notification.';
           this.snackbar.open(`❌ ${errorMessage}`, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'] // Utilise la classe CSS d'erreur
           });
        }
      });
  }

  getStatusColor(statut: string): string {
    if (statut.toLowerCase().includes('accept')) {
      return 'green';
    } else if (statut.toLowerCase().includes('refus') || statut.toLowerCase().includes('programmé')) {
      return 'red';
    } else {
      return 'black'; // Default color
    }
  }
  
}
