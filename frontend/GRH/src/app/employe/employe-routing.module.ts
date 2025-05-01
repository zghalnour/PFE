import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DemandeCongeComponent } from './demande-conge/demande-conge.component';
const routes: Routes = [{ path: '', component: DashboardComponent },{ path: 'demande-conge', component: DemandeCongeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeRoutingModule { }
