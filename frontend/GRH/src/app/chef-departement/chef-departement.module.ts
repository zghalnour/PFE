import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChefDepartementRoutingModule } from './chef-departement-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    ChefDepartementRoutingModule
  ]
})
export class ChefDepartementModule { }
