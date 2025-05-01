import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProjectManagementComponent } from './project-management/project-management.component';
import { TraitementCongeComponent } from './traitement-conge/traitement-conge.component';
import { AbsencesComponent } from './absences/absences.component';
const routes: Routes = [{ path: '', component: DashboardComponent }, { path: 'project-management', component: ProjectManagementComponent },
  { path: 'traitement-conge', component: TraitementCongeComponent },{path:'absences',component:AbsencesComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionnaireRHRoutingModule { }
