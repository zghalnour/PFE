import { NgModule ,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

import { NgChartsModule } from 'ng2-charts';
import { UserManagementComponent } from './user-management/user-management.component';
import { OffreComponent } from './offre/offre.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { CandidaturesComponent } from './candidatures/candidatures.component';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { CandidatureDetailsDialogComponent } from './candidature-details-dialog/candidature-details-dialog.component';
import { HeaderComponent } from './header/header.component';
import { DepartementsComponent } from './departements/departements.component';
import { EmployesComponent } from './employes/employes.component';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA] ,
  declarations: [
    DashboardComponent,
    UserManagementComponent,
    OffreComponent,
    CandidaturesComponent,
    CandidatureDetailsDialogComponent,
    HeaderComponent,
    DepartementsComponent,
    EmployesComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    NgChartsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatOptionModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule
  ]
})
export class AdminModule { }
