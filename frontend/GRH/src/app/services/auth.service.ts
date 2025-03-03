import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  login(token: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role); // Stocke le rôle dans localStorage
  }

  // Vérifier si un utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupérer le rôle de l'utilisateur
  getUserRole(): string {
    return localStorage.getItem('role') || 'condidat'; // 'condidat' par défaut
  }

  // Déconnexion
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
}
