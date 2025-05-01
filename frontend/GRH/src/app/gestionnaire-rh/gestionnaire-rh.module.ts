import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule  } from '@angular/forms';
import { GestionnaireRHRoutingModule } from './gestionnaire-rh-routing.module';
import { HeaderComponent } from './header/header.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { MatButtonModule } from '@angular/material/button'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectManagementComponent } from './project-management/project-management.component';
import { TraitementCongeComponent } from './traitement-conge/traitement-conge.component'; 
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator'; // <--- IMPORTEZ CECI
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { AbsencesComponent } from './absences/absences.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDialogModule } from '@angular/material/dialog';

import {  LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');

@NgModule({
  declarations: [
    HeaderComponent,
    DashboardComponent,
    ProjectManagementComponent,
    TraitementCongeComponent,
    AbsencesComponent,
  
  ],
  imports: [
    CommonModule,
    GestionnaireRHRoutingModule,
    FormsModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    CalendarModule.forRoot({ // Import et configuration d'angular-calendar
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatCardModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDialogModule
    
  ],

})
export class GestionnaireRHModule { }
