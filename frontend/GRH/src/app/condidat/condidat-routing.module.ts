import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PostulerComponent } from './postuler/postuler.component';
const routes: Routes = [{ path: '', component: DashboardComponent },{ path: 'postuler', component: PostulerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CondidatRoutingModule { 

}
