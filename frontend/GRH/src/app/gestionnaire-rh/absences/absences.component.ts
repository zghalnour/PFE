import { Component,ViewEncapsulation  } from '@angular/core';
import {  OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
interface AbsenceData {
  id: number;
  employeId: number;
  nomEmploye: string; // Prénom + Nom
  dateDebut: string; // Format ISO string 'YYYY-MM-DD' ou complet
  dateFin: string;   // Format ISO string 'YYYY-MM-DD' ou complet
  typeAbsence: string; // Ex: 'Congé Payé', 'Maladie'
  statut: string; // Ex: 'Approuvée' (on ne veut afficher que les approuvées)
}

// Interface pour les métadonnées de nos événements de calendrier
interface AbsenceEventMeta {
  employeId: number;
  nomEmploye: string;
  typeAbsence: string;
}
@Component({
  selector: 'app-absences',
  templateUrl: './absences.component.html',
  styleUrl: './absences.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbsencesComponent implements OnInit {
  filterForm: FormGroup;
  view: CalendarView = CalendarView.Month; // Vue par défaut : Mois
  viewDate: Date = new Date(); // Date affichée par défaut : Aujourd'hui
  events: CalendarEvent<AbsenceEventMeta>[] = [];
  isLoading = false;
  refresh = new Subject<void>(); // Pour rafraîchir le calendrier

  // Couleurs pour les événements (optionnel)
  absenceColors = {
    conge: { primary: '#1e90ff', secondary: '#D1E8FF' }, // Bleu pour congé
    maladie: { primary: '#e3bc08', secondary: '#FDF1BA' }, // Jaune pour maladie
    autre: { primary: '#ad2121', secondary: '#FAE3E3' }, // Rouge par défaut
  };
  CalendarView = CalendarView;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      dateDebut: [null],
      dateFin: [null],
    });
  }

  ngOnInit(): void {
    // Écoute les changements de date pour recharger les données
    this.filterForm.valueChanges.subscribe(values => {
      if (values.dateDebut && values.dateFin) {
        this.fetchAbsences(values.dateDebut, values.dateFin);
        // Centre le calendrier sur la date de début si elle change
        if (this.viewDate.getMonth() !== values.dateDebut.getMonth() || this.viewDate.getFullYear() !== values.dateDebut.getFullYear()) {
            this.viewDate = values.dateDebut;
        }
      } else {
        // Si les dates sont effacées, vide le calendrier
        this.events = [];
        this.refresh.next();
      }
    });

    // Charge les absences pour le mois courant initialement (optionnel)
    // const today = new Date();
    // const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // this.filterForm.patchValue({ dateDebut: startOfMonth, dateFin: endOfMonth }, { emitEvent: false }); // Ne déclenche pas valueChanges ici
    // this.fetchAbsences(startOfMonth, endOfMonth);
  }

  fetchAbsences(dateDebut: Date, dateFin: Date): void {
    if (!dateDebut || !dateFin) return;

    this.isLoading = true;
    this.events = []; // Vide les anciens événements

    // Formate les dates pour l'API (ex: YYYY-MM-DD)
    const debutStr = dateDebut.toISOString().split('T')[0];
    const finStr = dateFin.toISOString().split('T')[0];

    // Adapte l'URL à ton API
    const apiUrl = `http://localhost:5053/api/Conge/approved?dateDebut=${debutStr}&dateFin=${finStr}`;
    // Ou une URL spécifique pour les absences si différente

    this.http.get<AbsenceData[]>(apiUrl)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck(); // Marque pour la détection de changements
      }))
      .subscribe({
        next: (absences) => {
          this.events = this.processAbsencesToEvents(absences, dateDebut, dateFin);
          this.refresh.next(); // Rafraîchit le calendrier
          console.log('Absences chargées et transformées en événements:', this.events);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des absences:', error);
          this.events = []; // Vide en cas d'erreur
          this.refresh.next();
        }
      });
  }

  processAbsencesToEvents(absences: AbsenceData[], filterStart: Date, filterEnd: Date): CalendarEvent<AbsenceEventMeta>[] {
    const newEvents: CalendarEvent<AbsenceEventMeta>[] = [];
    const filterInterval = { start: startOfDay(filterStart), end: endOfDay(filterEnd) };

    absences.forEach(absence => {
      const absenceStart = startOfDay(new Date(absence.dateDebut));
      const absenceEnd = endOfDay(new Date(absence.dateFin)); // Utilise endOfDay pour inclure le dernier jour

      // Itère sur chaque jour de l'absence
      let currentDate = absenceStart;
      while (currentDate <= absenceEnd) {
        // Vérifie si le jour courant est dans la période filtrée
        if (isWithinInterval(currentDate, filterInterval)) {
          // Crée un événement pour ce jour spécifique
          newEvents.push({
            start: startOfDay(currentDate), // Début de la journée
            end: endOfDay(currentDate),     // Fin de la journée
            title: `${absence.nomEmploye} (${absence.typeAbsence})`, // Titre de l'événement
            color: this.getEventColor(absence.typeAbsence), // Couleur basée sur le type
            meta: { // Stocke les infos supplémentaires
              employeId: absence.employeId,
              nomEmploye: absence.nomEmploye,
              typeAbsence: absence.typeAbsence,
            },
            allDay: true, // Marque comme événement sur toute la journée
            // actions: this.actions, // Ajoute des actions si nécessaire (ex: voir détails employé)
            resizable: { beforeStart: false, afterEnd: false }, // Non redimensionnable
            draggable: false, // Non déplaçable
          });
        }
        // Passe au jour suivant
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    });

    return newEvents;
  }

  getEventColor(typeAbsence: string): { primary: string; secondary: string } {
    const lowerType = typeAbsence.toLowerCase();
    if (lowerType.includes('maladie')) {
      return this.absenceColors.maladie;
    } else if (lowerType.includes('cong')) { // Inclut 'Congé Payé', 'Congé Sans Solde', etc.
      return this.absenceColors.conge;
    }
    return this.absenceColors.autre; // Couleur par défaut
  }
  isClickOutsideEvent(event: Event): boolean {
    // Safely cast the target to Element and check for null
    const targetElement = event.target as Element;
    if (!targetElement) {
      return true; // If target is null, treat as outside
    }
    // Check if the target or its parent has the class '.cal-event'
    return !targetElement.closest('.cal-event');
  }
  // --- Méthodes pour interagir avec le calendrier (optionnel) ---
  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    console.log('Jour cliqué:', date, 'Événements:', events);
    // Tu pourrais ouvrir un popup listant les employés absents ce jour-là
  }

  eventClicked(event: CalendarEvent<AbsenceEventMeta>): void {
    console.log('Événement cliqué:', event);
    // Tu pourrais ouvrir un popup avec les détails de l'absence ou de l'employé
  }

  // Permet de changer de vue (Mois, Semaine, Jour) - Optionnel
  setView(view: CalendarView) {
    this.view = view;
  }
}
