import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
 import { Router } from '@angular/router';
 import { Observable } from 'rxjs';
 import { catchError, throwError, tap } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  isSignUp: boolean = false;
  apiUrl = 'http://localhost:5053/api/Auth';
  
  signUpForm = {
    nomPrenom: '',
    email: '',
    password: '',
    role: 'Admin'
  };

  loginForm = {
    email: '',
    password: ''
  };
  ngOnInit() {
    const role = localStorage.getItem('role');
    if (role) {
      this.redirectUser(role);
    }
  }
  

  toggleForm() {
    this.isSignUp = !this.isSignUp;
  }
  constructor(private http: HttpClient, private router: Router) {}

  onSignUp() {
    this.http.post(`${this.apiUrl}/register`, this.signUpForm).subscribe({
      next: (response) => {
  
        this.onLogin(this.signUpForm.email, this.signUpForm.password);
      },
      error: (error) => {
        alert('Erreur lors de l\'inscription : ' + error.error);
      }
    });
  }

  onLogin(email: string, password: string) {
    const loginData = { email: email, password: password };

    this.http.post<{ token: string, role: string }>(`${this.apiUrl}/login`, loginData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        
        console.log('Connexion réussie ! Rôle récupéré :', response.role);
        
        // ✅ Redirection immédiate après connexion
        this.redirectUser(response.role);
      },
      error: (error) => {
        alert('Identifiants incorrects');
      }
    });
  }
  redirectUser(role: string) {
    console.log('Redirection vers :', role);
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
        this.router.navigate(['/login']);
        break;
    }
  }

  
  
}
