import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})

export class UserManagementComponent implements OnInit{
  
  constructor(private http: HttpClient){}
  
  public getRoleStyling(role: string): { icon: string; classes: string } {
  if (!role) {
    return { icon: 'fas fa-tag', classes: 'bg-gray-100 text-gray-700' };
  }
  switch (role.toLowerCase()) {
    case 'admin':
      return { icon: 'fas fa-user-shield', classes: 'bg-sky-100 text-sky-700' };
    case 'rh': // Exemple pour GestionnaireRH
      return { icon: 'fas fa-users-cog', classes: 'bg-purple-100 text-purple-700' };
    case 'employe': // Exemple pour Employe
      return { icon: 'fas fa-user', classes: 'bg-indigo-100 text-indigo-700' };
  
    default:
      return { icon: 'fas fa-tag', classes: 'bg-gray-100 text-gray-700' };
  }
}
  ngOnInit() {this.fetchUsers();
  
  }

  users :any[]=[];
  isModalOpen = false;
  userToEdit: any = { // Initialisation de userToEdit
    id: 1,
    nomPrenom: '',
    email: '',
    role: '', // Le rôle initial de l'utilisateur
  }; 
  filteredUsers = [...this.users]; // Copie de la liste filtrée
  searchTerm: string = '';
  selectedRole: string = '';

  roles = ['Tous', 'Admin', 'Employe', 'GestionnaireRH'];


  trackByFn(index: number, item: string): string {
    return item;
  }
 
  fetchUsers(){
    this.http.get<any[]>('http://localhost:5053/api/Users/allUsers').subscribe(
      (data)=>{this.users=data; this.filteredUsers=[...this.users]},
      (error)=>{console.error('Erreur lors de la récupération des utilisateurs:', error);}
    );
  }

  getRoleClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'badge-primary';
      case 'employe': return 'badge-success';
      case 'candidat': return 'badge-warning';
      case 'gestionnaire rh': return 'badge-accent';
      default: return 'badge-neutral';
    }
  }
  filterUsers() {
    this.filteredUsers = this.users.filter(user => 
      (this.selectedRole === 'Tous' || this.selectedRole === '' || user.role.toLowerCase() === this.selectedRole.toLowerCase()) &&
      user.nomPrenom.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
  openEditModal(userId: number) {
    this.isModalOpen = true;
  
    // Appeler l'API pour récupérer les détails de l'utilisateur
    this.http.get(`http://localhost:5053/api/Users/user/${userId}`).subscribe(
      (response) => {
        this.userToEdit = response;
      
        console.log("Rôle de l'utilisateur :", this.userToEdit.role); // Remplir la variable userToEdit avec les données reçues
      },
      (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    );
  
  }

  addUser() {
    console.log('Ajouter un utilisateur');
  }

  updateUser() {

  
    const url = `http://localhost:5053/api/Users/modifier/${this.userToEdit.id}`;
    
    // Effectuer l'appel PUT pour modifier l'utilisateur
    this.http.put(url, this.userToEdit).subscribe(
      (response) => {
        console.log('Utilisateur modifié avec succès', response);
        this.isModalOpen = false; // Fermer le modal après modification
        this.fetchUsers(); // Recharger les utilisateurs après modification
      },
      (error) => {
        console.error('Erreur lors de la modification de l\'utilisateur:', error);
      }
    );
  
  }
  

  deleteUser(userId: number) {
    // Appel HTTP DELETE à l'API
    this.http.delete(`http://localhost:5053/api/Users/supprimer/${userId}`).subscribe({
      next: (response) => {
        console.log('Utilisateur supprimé avec succès');
        // Mettre à jour la liste des utilisateurs après suppression
      
        this.fetchUsers(); // Mettre à jour la liste affichée
      },
      error: (err) => {
        console.error('Erreur lors de la suppression de l\'utilisateur', err);
      }
    });
  }

}
