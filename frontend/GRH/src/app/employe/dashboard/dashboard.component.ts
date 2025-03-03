import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
   constructor(private http: HttpClient, private router: Router) {}
   logout() {
     this.http.post('http://localhost:5053/api/Auth/logout', {}).subscribe({
       next: (response) => {
         console.log('Déconnexion réussie:', response);
         localStorage.removeItem('token');
         localStorage.removeItem('role');
         console.log('Après déconnexion:', {
           token: localStorage.getItem('token'),
           role: localStorage.getItem('role')
         });
         // Rediriger vers la page de connexion
         this.router.navigate(['/login']);
       },
       error: (err) => {
         console.error('Erreur lors de la déconnexion:', err);
       }
     });
   }
}
