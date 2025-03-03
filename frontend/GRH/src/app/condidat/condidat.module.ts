import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CondidatRoutingModule } from './condidat-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    CondidatRoutingModule
  ]
})
export class CondidatModule { }
