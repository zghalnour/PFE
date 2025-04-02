import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { OffreComponent } from './offre/offre.component';
import { CandidaturesComponent } from './candidatures/candidatures.component';
import { DepartementsComponent } from './departements/departements.component';
import { EmployesComponent } from './employes/employes.component';
const routes: Routes = [{ path: '', component: DashboardComponent }, { path: 'users', component: UserManagementComponent },
  {path:'offres',component:OffreComponent},  { path: 'candidatures/:titre', component: CandidaturesComponent },
  { path: 'departements', component: DepartementsComponent },{ path: 'employes', component:EmployesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
