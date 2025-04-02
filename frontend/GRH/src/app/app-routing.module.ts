import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './guards/auth.guard';
const routes: Routes = [
  { path: 'login', component: AuthComponent },
  { path: '', redirectTo: '/candidat', pathMatch: 'full' }, // Rediriger les utilisateurs vers condidat par défaut

  // ✅ Le candidat peut accéder sans connexion
  { 
    path: 'candidat', 
    loadChildren: () => import('./condidat/condidat.module').then(m => m.CondidatModule) 
  },

  // 🔒 Les autres routes nécessitent une authentification
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard] 
  },
  { 
    path: 'chef-departement', 
    loadChildren: () => import('./chef-departement/chef-departement.module').then(m => m.ChefDepartementModule),
    canActivate: [AuthGuard] 
  },
  { 
    path: 'employe', 
    loadChildren: () => import('./employe/employe.module').then(m => m.EmployeModule),
    canActivate: [AuthGuard] 
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
