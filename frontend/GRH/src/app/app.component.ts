import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    console.log(role);
    console.log(token);

    if (!token) {
      // Aucun utilisateur connecté => Rediriger vers candidat
      console.log("Pas de token -> Redirection vers /condidat");
      this.router.navigate(['/condidat']);
    } else {
      // Rediriger vers le dashboard correspondant au rôle
      switch (role) {
        case 'Admin':
          this.router.navigate(['/admin']);
          break;
        case 'GestionnaireRH':
          this.router.navigate(['/chef-departement']);
          break;
        case 'Employe':
          this.router.navigate(['/employe']);
          break;
        default:
          this.router.navigate(['/condidat']); // Par défaut vers candidat
      }
    }
  }
}
