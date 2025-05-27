import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
 import { Router } from '@angular/router';
 import { Observable } from 'rxjs';
 import { catchError, throwError, tap } from 'rxjs';
 interface LoginResponse {
  token: string;
  role: string;
  userId: number; // Assuming userId is a number
  nomUtilisateur: string;
}
@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  isSignUp: boolean = false;
  apiUrl = 'http://localhost:5053/api/Auth';
   emailExistsError: boolean = false;
  genericSignUpError: string | null = null;
  showSignUpPassword: boolean = false;
   loginErrorMessage: string | null = null;

  signUpForm = {
    nomPrenom: '',
    telephone: '',
    email: '',
    password: '',
    role: ''
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
    this.emailExistsError = false;
    this.genericSignUpError = null;
    // Optionnel: réinitialiser les champs des formulaires
    // this.signUpForm = { nomPrenom: '', email: '', password: '', role: null };
    // this.loginForm = { email: '', password: '' };
  }
  constructor(private http: HttpClient, private router: Router) {}

  onSignUp() {
  this.emailExistsError = false;
  this.genericSignUpError = null;
  const data = {
    nomPrenom: this.signUpForm.nomPrenom,
    telephone: this.signUpForm.telephone,
    email: this.signUpForm.email,
    password: this.signUpForm.password,
    role: this.signUpForm.role
  };
  console.log(data);
    this.http.post(`${this.apiUrl}/register`, data).subscribe({
      next: (response) => {
        // Connexion automatique après inscription réussie
        this.onLogin(this.signUpForm.email, this.signUpForm.password);
      },
      error: (err) => {
        let backendMessage = '';
        if (err.error && typeof err.error === 'string') {
          backendMessage = err.error;
        } else if (err.message) {
          backendMessage = err.message;
        }

        const lowerBackendMessage = backendMessage.toLowerCase();

        if (lowerBackendMessage.includes('email') && (lowerBackendMessage.includes('exist') || lowerBackendMessage.includes('existe') || lowerBackendMessage.includes('déjà'))) {
          this.emailExistsError = true;
        } else if (backendMessage) {
          this.genericSignUpError = `Erreur lors de l'inscription: ${backendMessage}`;
        } else {
          this.genericSignUpError = 'Une erreur inconnue est survenue. Veuillez réessayer.';
        }
        console.error('Erreur lors de l\'inscription :', err);
      }
    });
  }

  onLogin(email: string, password: string) {
    this.emailExistsError = false; // Réinitialiser les erreurs d'inscription
    this.genericSignUpError = null; // Réinitialiser les erreurs d'inscription
    this.loginErrorMessage = null;
    const loginData = { email: email, password: password };
    this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
        localStorage.setItem('userName', response.nomUtilisateur);
        localStorage.setItem('userId', response.userId.toString());
        console.log('Connexion réussie ! Rôle récupéré :', response.role);
        this.redirectUser(response.role);
      },
      error: (error) => {
             if (error.status === 401) {
          if (error.error && typeof error.error === 'string') {
            this.loginErrorMessage = error.error; // "Identifiants incorrects."
          } else if (error.error && error.error.message) {
            this.loginErrorMessage = error.error.message; // "Ce compte est désactivé."
          } else {
            this.loginErrorMessage = "Une erreur d'authentification s'est produite."; // Message générique
          }
        } else {
          // Gérer d'autres types d'erreurs (500, etc.)
          this.loginErrorMessage = "Une erreur inattendue s'est produite. Veuillez réessayer.";
        }
        
      }
      
    });
  }
redirectUser(role: string) {
  const normalizedRole = role.toLowerCase();
  console.log('Redirection vers :', normalizedRole);

  if (normalizedRole.includes('admin')) {
    this.router.navigate(['/admin']);
  } else if (normalizedRole.includes('rh')) {
    this.router.navigate(['/gestionnaire-rh']);
  } else if (!normalizedRole.includes('rh')) {
    this.router.navigate(['/employe']);
  } else {
    this.router.navigate(['/login']);
  }
}

  continueWithoutLogin() {
    this.router.navigate(['/candidat']);
  }
  

  
  
}
