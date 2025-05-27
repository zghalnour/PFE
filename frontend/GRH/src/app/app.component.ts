import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}
  ngOnInit() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    console.log(role);
    console.log(token);

    if (token==null) {
    
      console.log("Pas de token -> Redirection vers /condidat");
      this.router.navigate(['/candidat']);
    } else {
      // Rediriger vers le dashboard correspondant au rôle
      switch (role?.toLocaleLowerCase()) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'gestionnairerh':
          this.router.navigate(['/gestionnaire-rh']);
          break;
        case 'employe':
          this.router.navigate(['/employe']);
          break;
        default:
          this.router.navigate(['/login']); // Par défaut vers candidat
      }
    }
  }
}
