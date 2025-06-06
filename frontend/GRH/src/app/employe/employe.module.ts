import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { EmployeRoutingModule } from './employe-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';

import { NgChartsModule } from 'ng2-charts';
import { DemandeCongeComponent } from './demande-conge/demande-conge.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EntretiensComponent } from './entretiens/entretiens.component';
import { IntegrationComponent } from './integration/integration.component';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    DashboardComponent,
    HeaderComponent,
    DemandeCongeComponent,
    EntretiensComponent,
    IntegrationComponent
  ],
  imports: [
    CommonModule,
    EmployeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    QRCodeModule
  
  ]
})
export class EmployeModule { }
