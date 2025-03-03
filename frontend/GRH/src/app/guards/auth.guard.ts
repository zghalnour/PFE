import { CanActivateFn } from '@angular/router';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true; // L'utilisateur est connecté, il peut accéder à la route
    } else {
      this.router.navigate(['/login']); // Redirige vers la page de connexion si non connecté
      return false;
    }
  }
}
