import { Component ,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import * as signalR from '@microsoft/signalr'; // Import SignalR
export interface Notification {
  id: number; // Assuming notifications have an ID from the backend
  contenu: string;
  link: string;
  isRead: boolean;
  candidatureId:number
  // Add other relevant properties like createdAt if available
}
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  constructor(private http:HttpClient, private router: Router) {this.currentRoute = this.router.url;}
  nomUtilisateur: string = "";

  currentRoute: string = '/users';
  activePage: string = "users";
   // --- Notification Properties ---
   unreadCount: number = 0;
   notifications: Notification[] = [];
   showDropdown: boolean = false;
   private hubConnection!: signalR.HubConnection;
   private notificationApiBaseUrl = 'http://localhost:5053/api/Notif';
   private signalRHubUrl = 'http://localhost:5053/notificationHub';


  ngOnInit() {
    this.loadInitialNotifications();
    this.startSignalRConnection();
    this.addSignalRListener();
    this.loadUserData();
  }

  loadUserData(): void {
    const storedName = localStorage.getItem('userName');
  
  
    if (storedName) {
      this.nomUtilisateur = storedName;
    }
  
  }
  startSignalRConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.signalRHubUrl, {
          // Optional: Configure transport types, logging, access token factory
          // accessTokenFactory: () => localStorage.getItem('token') // Example: If auth is needed
      })
      .withAutomaticReconnect() // Automatically try to reconnect if the connection is lost
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));
  }

  addSignalRListener = () => {
    // Listen for the specific method name your backend hub uses to send notifications
    this.hubConnection.on('ReceiveNotification', (notificationData: any) => { // Use 'any' or a specific DTO type
      console.log('SignalR notification received:', notificationData);

      // Construct the Notification object based on received data
      // Adapt property names (message, link) based on what your backend sends
      const newNotification: Notification = {
        id: notificationData.id || Date.now(), // Use ID from backend or generate temporary one
        contenu: notificationData.contenu,
        link: notificationData.link,
        candidatureId: notificationData.candidatureId,
        isRead: false // New notifications are unread
      };

      // Add to the beginning of the list and update count
      this.notifications.unshift(newNotification);
      this.unreadCount++;

      // Optional: Limit the number of notifications stored/displayed
      // if (this.notifications.length > 20) { this.notifications.pop(); }

      // Note: Since this runs outside Angular's zone sometimes,
      // you *might* need NgZone.run() for UI updates if they don't happen automatically,
      // but often Angular handles it with HttpClient/async pipe. Test first.
      // Example: this.zone.run(() => { this.unreadCount++; });
    });

    // Optional: Handle reconnection events
    this.hubConnection.onreconnecting(error => {
        console.warn(`SignalR connection lost. Attempting to reconnect... ${error}`);
    });

    this.hubConnection.onreconnected(connectionId => {
        console.log(`SignalR connection reestablished. Connected with connectionId=${connectionId}`);
        // Optional: Reload notifications after reconnecting to ensure nothing was missed
        // this.loadInitialNotifications();
    });

    this.hubConnection.onclose(error => {
        console.error(`SignalR connection closed unexpectedly. ${error}`);
        // Optional: Implement custom logic if connection cannot be re-established
    });
  }
  loadInitialNotifications(): void {
    // Get the user ID string from localStorage
    const userIdString = localStorage.getItem('userId');

    // 1. Check if the userIdString exists first
    if (!userIdString) {
      console.error('Error loading notifications: User ID not found in localStorage.');
      // Handle appropriately - maybe redirect to login or show an error
      // Example: this.router.navigate(['/login']);
      return; // Stop execution if ID is missing
    }

    // 2. Try to parse the userIdString
    const userId = parseInt(userIdString, 10);

    // 3. Check if parsing resulted in a valid number
    if (isNaN(userId)) {
        console.error('Error loading notifications: Invalid User ID format found in localStorage.');
        // Handle appropriately
        return; // Stop execution if ID is not a number
    }

    // 4. Construct the API URL now that we have a valid userId
    const apiUrl = `${this.notificationApiBaseUrl}/getAllForUser/${userId}`;

    // Make the HTTP GET request
    // Consider adding subscription management (like in the previous example) if needed
    this.http.get<Notification[]>(apiUrl).subscribe({
        next: (data) => {
          // Map data and ensure 'isRead' property is correctly handled
          this.notifications = data.map(n => ({
              ...n,
              isRead: n.isRead // Adjust if backend sends 'estLu' or similar
          })).sort((a, b) => b.id - a.id); // Sort by ID descending

          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          console.log('Initial notifications loaded:', this.notifications);
        },
        error: (error) => {
          console.error('Error loading initial notifications:', error);
          this.notifications = []; // Clear notifications on error
          this.unreadCount = 0;
          // Handle error appropriately (e.g., show a message using MatSnackBar)
          // Example: this.snackbar.open('Failed to load notifications.', 'Close', { duration: 3000 });
        }
      });
  }

  navigateTo(notificationId: number, candidatureId: number): void {
    if (candidatureId) {
      this.router.navigate(['/candidat-parcours', candidatureId]);
      this.showDropdown = false;
      this.markAsRead(notificationId);
    } else {
      console.warn('Aucun candidatureId trouvé pour cette notification.');
    }
  }
  

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId && !n.isRead);
    if (notification) {
      
      const apiUrl = `${this.notificationApiBaseUrl}/markAsRead/${notificationId}`; // <<< ADAPT THIS ENDPOINT

      this.http.put(apiUrl, {}).subscribe({ // Assuming PUT request with no body
          next: () => {
            console.log(`Notification ${notificationId} marked as read.`);
            notification.isRead = true; // Update local state
            this.unreadCount = this.notifications.filter(n => !n.isRead).length; // Recalculate count
          },
          error: (error) => {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            // Handle error
          }
        });
    }
  }
  toggleDropdown(): void {
    // Log l'état actuel AVANT de changer la visibilité
    console.log('Ouverture/Fermeture dropdown. Notifications actuelles:', this.notifications);
    console.log('Compte non lu actuel:', this.unreadCount);
  
    this.showDropdown = !this.showDropdown;
    // Optionnel: Marquer comme lu à l'ouverture ?
    // if (this.showDropdown && this.unreadCount > 0) {
    //   this.markAllAsRead();
    // }
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
