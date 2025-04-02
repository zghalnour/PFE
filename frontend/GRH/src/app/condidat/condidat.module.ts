import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CondidatRoutingModule } from './condidat-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormsModule } from '@angular/forms';
import { PostulerComponent } from './postuler/postuler.component';


@NgModule({
  declarations: [
    DashboardComponent,
    PostulerComponent
  ],
  imports: [
    CommonModule,
    CondidatRoutingModule,
    FormsModule
  ]
})
export class CondidatModule { }
