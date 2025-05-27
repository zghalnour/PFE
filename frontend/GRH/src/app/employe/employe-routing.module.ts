import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DemandeCongeComponent } from './demande-conge/demande-conge.component';
import { EntretiensComponent } from './entretiens/entretiens.component';
const routes: Routes = [{ path: '', component: DashboardComponent },{ path: 'demande-conge', component: DemandeCongeComponent },
  { path: 'entretiens', component: EntretiensComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeRoutingModule { }
