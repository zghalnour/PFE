import { Component ,OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
export interface Entretien {
  nomOffre: string;
  nomPrenom: string; // Candidate's name
  typeEntretien: string;
  dateEntretien: string | Date; // Can be string from API, then converted to Date
  modeEntretien: string;
  statut: 'En cours' | 'Passé' | 'Echoué' | string; // More specific types for status
  commentaire?: string;
  showEvaluationForm?: boolean; // UI state, not from backend
  // Keep 'id' as the primary identifier used within the component,
  // but map from 'idEntretien' from the backend.
  id: number; 
}

// Interface for the raw API response
export interface ApiEntretienResponse {
  idEntretien: number;
  typeEntretien: string;
  dateEntretien: string;
  modeEntretien: string;
  nomOffre: string;
  nomPrenom: string;
  commentaire: string;
  statutEntretien: string;
}

// Interface for the API response when an interview is updated
export interface ApiUpdateEntretienResponse {
  id: number;
  commentaire: string;
  statut: string;
  candidatureId: number;
}
@Component({
  selector: 'app-entretiens',
  templateUrl: './entretiens.component.html',
  styleUrl: './entretiens.component.css'
})
export class EntretiensComponent implements OnInit {
  entretiens: Entretien[] = [];
isLoading: boolean = false; // To manage loading state, e.g., for a spinner

  // Assuming the logged-in employee's ID is available (e.g., from a service or localStorage)
  private loggedInEmployeeId: number | null = null; // Example: 1;

  constructor(private http: HttpClient) { // Replace HttpClient with your InterviewService if you have one
    // Example: Get logged-in employee ID
    // This is a placeholder. Implement actual logic to get the employee's ID.
     this.loggedInEmployeeId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!, 10) : null; 
  }

  ngOnInit(): void {
    this.fetchEntretiens();
  }

  fetchEntretiens(): void {
    if (!this.loggedInEmployeeId) {
      console.error('Employee ID not available. Cannot fetch interviews.');
      // Optionally, display a message to the user
      return;
    }

    this.isLoading = true;
    // Adjust the API endpoint as per your backend
    // This endpoint should return interviews assigned to the loggedInEmployeeId
    const apiUrl = `http://localhost:5053/api/Entretien/by-responsable-id?id=${this.loggedInEmployeeId}`;

    this.http.get<ApiEntretienResponse[]>(apiUrl).subscribe({
      next: (data) => {
        this.entretiens = data.map(apiEntretien => ({
          // Map API response to the component's Entretien interface
          id: apiEntretien.idEntretien,
          nomOffre: apiEntretien.nomOffre,
          nomPrenom: apiEntretien.nomPrenom,
          typeEntretien: apiEntretien.typeEntretien,
          dateEntretien: apiEntretien.dateEntretien, // Assuming it's already in a usable format or string
          modeEntretien: apiEntretien.modeEntretien,
          statut: apiEntretien.statutEntretien,
          commentaire: apiEntretien.commentaire, // If provided by this endpoint
          showEvaluationForm: false // Initialize UI state property
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching interviews:', error);
        this.isLoading = false;
        // Optionally, show an error message to the user
      }
    });
  }

  toggleEvaluationForm(entretien: Entretien): void {
    // Close other open forms if you want only one open at a time
    // this.entretiens.forEach(e => {
    //   if (e.id !== entretien.id) {
    //     e.showEvaluationForm = false;
    //   }
    // });
    entretien.showEvaluationForm = !entretien.showEvaluationForm;
  }

  submitEvaluation(entretienToUpdate: Entretien, decision: 'Passé' | 'Echoué'): void {
    if (!entretienToUpdate.commentaire || entretienToUpdate.commentaire.trim() === '') {
      alert('Veuillez saisir un commentaire.'); // Or use a more sophisticated notification
      return;
    }

    const evaluationData = {
      statut: decision,
      commentaire: entretienToUpdate.commentaire
    };

    // Adjust the API endpoint as per your backend
    const apiUrl = `http://localhost:5053/api/Entretien/update/${entretienToUpdate.id}`; 
    this.isLoading = true; // Indicate loading

    this.http.put<ApiUpdateEntretienResponse>(apiUrl, evaluationData).subscribe({
      next: (apiResponse) => {
        // Update the local list with the response from the server
        const index = this.entretiens.findIndex(e => e.id === apiResponse.id);
        if (index !== -1) {
          // Preserve existing details not returned by the update API (like nomOffre, nomPrenom, etc.)
          // and update with the new status and comment.
          this.entretiens[index] = {
            ...this.entretiens[index], // Spread existing properties
            id: apiResponse.id,       // Update ID (should be the same)
            commentaire: apiResponse.commentaire,
            statut: apiResponse.statut,
            showEvaluationForm: false // Close form after submission
          };
        }
        this.isLoading = false;
        // Optionally, show a success message
        console.log('Evaluation submitted successfully. API Response:', apiResponse);
        const newCandidatureStatus = `Entretien${entretienToUpdate.typeEntretien}${decision === 'Passé' ? 'Accepté' : 'Refusé'}`;
        
        this.updateCandidatureStatus(
            apiResponse.candidatureId, // Use candidatureId from the API response
            newCandidatureStatus 
          );
      },
      error: (error) => {
        console.error('Error submitting evaluation:', error);
        this.isLoading = false;
        // Optionally, show an error message to the user
        alert('Erreur lors de la soumission de l\'évaluation.');
      }
    });
  }
    updateCandidatureStatus(candidatureId: number, newStatus: string): void {
    this.http
      .put<any>(
        `http://localhost:5053/api/Candidature/modifier-statut/${candidatureId}/${newStatus}`,
        {}
      )
      .subscribe({
        next: (response) => {
          console.log(
            `Candidature ${candidatureId} status updated to ${newStatus}`,
            response
          );
        
        },
        error: (error) => {
          console.error(
            `Error updating candidature ${candidatureId} status:`,
            error
          );
        },
      });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'En cours':
        return 'badge-warning';
      case 'Passé':
        return 'badge-success';
      case 'Echoué':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
