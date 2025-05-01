import { Component ,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  constructor(private http:HttpClient, private router: Router) {this.currentRoute = this.router.url;}
  nomUtilisateur: string = "";

  currentRoute: string = '';
  activePage: string = "";
  ngOnInit() {
    this.loadUserData();
  }
  loadUserData(): void {
    const storedName = localStorage.getItem('userName');
  
  
    if (storedName) {
      this.nomUtilisateur = storedName;
    }
  
  }
  setActivePage(page: string) {
    this.activePage = page;
  }
  setActiveRoute(route: string) {
    this.router.navigate([route]);  // Utilisez le router pour naviguer vers la route
    this.currentRoute = route;  // Mettez à jour la route actuelle
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
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
