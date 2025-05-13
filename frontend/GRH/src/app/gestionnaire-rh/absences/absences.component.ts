import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'; // Removed addDays as it's not used in the final version
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface AbsenceData {
  id: number;
  dateDebut: string;
  dateFin: string;
  nomEmploye: string;
}



@Component({
  selector: 'app-absences',
  templateUrl: './absences.component.html',
  styleUrl: './absences.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbsencesComponent implements OnInit {
  filterForm: FormGroup;
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  events: CalendarEvent<AbsenceData>[] = []; // Meta type is AbsenceData for primary events
  isLoading = false;
  refresh = new Subject<void>();
  uniqueEmployes: string[] = [];
  filteredEmployes: string[] = [];
  

  absenceColors = {
    default: { primary: '#ad2121', secondary: '#FAE3E3' }, // Unique color for all absences
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
      nomEmploye: ['']
    });
    
  }
  allAbsences: AbsenceData[] = [];

  ngOnInit(): void {
    this.isLoading = true;
    this.http.get<AbsenceData[]>('http://localhost:5053/api/DemCong/GetAbsences')
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe(
        absences => {
          this.allAbsences = absences;
          this.uniqueEmployes = [...new Set(absences.map(a => a.nomEmploye))];
          this.filteredEmployes = this.uniqueEmployes;
          this.applyDateFilter();
        },
        error => {
          console.error('Error fetching absences:', error);
          this.events = [];
        }
      );
  
    this.filterForm.valueChanges.subscribe(() => {
      this.applyDateFilter();
    });
  
    this.filterForm.get('nomEmploye')?.valueChanges.subscribe(value => {
      const filterValue = value?.toLowerCase() || '';
      this.filteredEmployes = this.uniqueEmployes.filter(name =>
        name.toLowerCase().includes(filterValue)
      );
    });
  }
  
  applyDateFilter(): void {
    const {  nomEmploye } = this.filterForm.value;
  
    let filtered = this.allAbsences;
  
  
  
    if (nomEmploye) {
      filtered = filtered.filter(abs => abs.nomEmploye === nomEmploye);
    }
    this.events = this.absencesToEvents(filtered);



  }
  
absencesToEvents(absences: AbsenceData[]): CalendarEvent<AbsenceData>[] {
  return absences.map(absence => {
    const startDate = startOfDay(new Date(absence.dateDebut));
    const endDate = endOfDay(new Date(absence.dateFin));

    return {
      start: startDate,
      end: endDate, // L'événement s'étend de la date de début à la date de fin
      title: absence.nomEmploye, // Le titre est le nom de l'employé
      color: this.absenceColors.default, // Utilisez la couleur définie pour les absences
       // Enlever l'affichage de l'événement comme une journée complète
      meta: { ...absence }, // Conserver les données d'absence originales si besoin
    
    };
  });
}

  

  

  isClickOutsideEvent(event: Event): boolean {
    const targetElement = event.target as Element;
    if (!targetElement) {
      return true;
    }
    return !targetElement.closest('.cal-event');
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    console.log('Day clicked:', date, 'Events:', events);
    // Potentially open a modal or navigate, or filter based on the clicked day
  }



  setView(view: CalendarView) {
    this.view = view;
    this.cdr.markForCheck();
  }

  // Call this method to refresh the calendar view if external changes occur
  triggerRefresh(): void {
    this.refresh.next();
    this.cdr.markForCheck();
  }
}
