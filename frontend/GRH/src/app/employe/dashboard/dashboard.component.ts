import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js'; 
interface Project {
  projetId: number;
  nomProjet: string;
  taches: Task[];
  nombreTachesCompletes: number;
  nombreTachesACompleter: number;
}
interface Task {
  tacheId: number;
  titre: string;
  description: string;
  statut: string; // "En cours", "Terminé", etc.
}


interface Meeting {
  reunionId: number;
  titre: string;
  dateEvaluation: string; 
  lieu: string;
}

interface SmartGoal {
  objectifId: number;
  description: string;
  etat: boolean;
}
interface MonthlyTaskCompletion {
  mois: string; // Format "YYYY-MM"
  nombreTaches: number;
}
export interface ResourceSuggestion {
  titre: string;
  lien: string;
  // Add other properties if your API returns more, e.g., description
}

// Interface for an item (task or goal) that has suggestions
export interface ActionableItemSuggestion {
  id: string | number; // Unique ID for the task or goal
  description: string; // Description of the task or goal
  suggestions: ResourceSuggestion[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  employeeName: string = ""; 
  employeId:number=0;
  employeeDepartment: string = "Développement Web"; 
  employeePosition: string = "Développeur Frontend "; 
  expandedProjectIndex: number | null = null;

  assignedProjects: Project[] = [];
  totalProjects: number = 0;
  totalIncompleteTasks: number = 0;
  totalCompletedTasks: number = 0;

  upcomingMeetings: Meeting[] = [];

  smartGoals: SmartGoal[] = [];
  monthlyTaskCompletionData: MonthlyTaskCompletion[] = [];
  

  complaintText: string = '';
  showComplaintForm: boolean = false;
  currentKpiValue: number = 0;
  resourceSearchTerm: string = '';
  suggestedResources: any | null = null;
  isLoadingResources: boolean = false;
  initialResourceSearchDone: boolean = false;
   isLoadingAutomaticSuggestions: boolean = false;
  actionableTaskSuggestions: ActionableItemSuggestion[] = [];
  actionableGoalSuggestions: ActionableItemSuggestion[] = [];
  public kpiGaugeData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Atteint', 'Restant'],
    datasets: [{
      data: [this.currentKpiValue, 100 - this.currentKpiValue],
      backgroundColor: ['#28a745', '#e9ecef'],
      hoverBackgroundColor: ['#28a745', '#e9ecef'], 
      borderWidth: 0,
      circumference: 180, // Demi-cercle
      rotation: 270,      // Commence en bas
    }]
  };
  public kpiGaugeOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    cutout: '70%', // Crée l'effet de jauge
  };
  fetchSuggestedResources(): void {
    if (!this.resourceSearchTerm.trim()) {
      // Optionally, clear results or show a message if search term is empty
      // this.suggestedResources = null;
      return;
    }
    this.isLoadingResources = true;
    this.initialResourceSearchDone = true;
    this.suggestedResources = null; // Clear previous results

    const payload = {
      task_description: this.resourceSearchTerm
    };

    this.http.post('http://localhost:5053/api/Ressource/rechercher', payload).subscribe({
      next: (response: any) => {
        this.suggestedResources = response;
        this.isLoadingResources = false;
        console.log('Suggested resources fetched:', response);
      },
      error: (err) => {
        console.error('Error fetching suggested resources:', err);
        this.suggestedResources = { tache: this.resourceSearchTerm, resultats: [] }; // Show "not found" for this search
        this.isLoadingResources = false;
        // Potentially set an error message to display to the user
      }
    });
  }
  selectedYear: number=2025;
  availableYears: number[] = [];
  isLoadingTrendData: boolean = true;
 
  // 2. Tendance de Performance (Ligne)
  public performanceLineChartData: ChartConfiguration<'line'>['data'] = {
    // Labels fixes pour les 12 mois
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        data: [], // Sera rempli par fetchPerformanceTrendData
        label: 'Tâches Complétées',
        fill: true,
        tension: 0.3,
        borderColor: 'rgba(0, 123, 255, 1)',
        backgroundColor: 'rgba(0, 123, 255, 0.1)'
      }
    ]
  };
  public performanceLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Important pour le conteneur pleine largeur
    scales: {
      y: {
        beginAtZero: true,
        title: { // Titre pour l'axe Y
          display: true,
          text: 'Nombre de Tâches Complétées'
        }
      },
      x: {
         title: { // Titre pour l'axe X
           display: true,
           text: 'Mois'
         }
      }
    },
    plugins: {
      legend: { display: true, position: 'top' } // Légende en haut pour plus d'espace
    }
  };


   constructor(private http: HttpClient, private router: Router) {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    // Générer une liste d'années (ex: 5 dernières années)
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
   }
   ngOnInit(): void {
    this.loadUserData();
    this.fetchEmployeeData();
    this.fetchProjectsAndTasks();
    
  }
   calculateAndSetKpi(): void {
    const totalTasks = this.totalCompletedTasks + this.totalIncompleteTasks;
    const taskCompletionRatio = totalTasks > 0 ? this.totalCompletedTasks / totalTasks : 0;

    const completedSmartGoals = this.smartGoals.filter(goal => goal.etat === true).length;
    const totalSmartGoals = this.smartGoals.length;
    const smartGoalCompletionRatio = totalSmartGoals > 0 ? completedSmartGoals / totalSmartGoals : 0;

    let kpiSum = 0;
    let kpiComponents = 0;

    if (totalTasks > 0) {
      kpiSum += taskCompletionRatio;
      kpiComponents++;
    }

    if (this.smartGoals && totalSmartGoals > 0) {
      kpiSum += smartGoalCompletionRatio;
      kpiComponents++;
    }

    this.currentKpiValue = kpiComponents > 0 ? Math.round((kpiSum / kpiComponents) * 100) : 0;
    this.currentKpiValue = Math.max(0, Math.min(100, this.currentKpiValue)); // Ensure 0-100 range

    // Update gauge data, re-assigning to ensure chart updates
    this.kpiGaugeData = {
      ...this.kpiGaugeData,
      datasets: [{ ...this.kpiGaugeData.datasets[0], data: [this.currentKpiValue, 100 - this.currentKpiValue] }]
    };
    console.log('KPI calculated and gauge updated:', this.currentKpiValue);
  }
  loadUserData(): void {
    const storedName = localStorage.getItem('userName');
    const storedUserId = localStorage.getItem('userId');
  
    if (storedName) {
      this.employeeName = storedName;
    }
  
    if (storedUserId) {
      this.employeId = parseInt(storedUserId, 10); 
    }
    console.log(this.employeId);
  
  
  }
  toggleProjectExpansion(index: number) {
    // If the clicked project is already expanded, collapse it. Otherwise, expand it.
    this.expandedProjectIndex = this.expandedProjectIndex === index ? null : index;
  }
  fetchProjectsAndTasks(): void {
  
  
    this.http.get<any>(`http://localhost:5053/api/Employe/api/employes/${this.employeId}/projets-taches`)
      .subscribe({
        next: (data) => {
          this.employeeDepartment = data.nomDepartement;
          this.employeePosition = data.poste;
          this.assignedProjects = data.projets;
          this.calculateStatistics();
          this.upcomingMeetings=data.reunionsAVenir;
          this.smartGoals=data.objectifsSmart;
          this.monthlyTaskCompletionData = data.nombreTachesCompletesParMois;
          this.calculateStatistics(); 
          this.calculateAndSetKpi();
          this.processPerformanceTrendData(this.selectedYear);
           this.fetchAutomaticSuggestions();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des projets et tâches', err);
        }
      });
  }
   fetchAutomaticSuggestions(): void {
    if (this.isLoadingAutomaticSuggestions) {
      return; // Prevent multiple simultaneous calls
    }
    this.isLoadingAutomaticSuggestions = true;
    this.actionableTaskSuggestions = [];
    this.actionableGoalSuggestions = [];

    const taskSuggestionPromises: Promise<void>[] = [];
    const goalSuggestionPromises: Promise<void>[] = [];

    // 1. Get suggestions for incomplete tasks
    this.assignedProjects.forEach(project => {
      project.taches.forEach(task => {
        if (task.statut !== 'Terminé' && task.statut !== 'Terminée') { // Check for various "incomplete" statuses
          const payload = { task_description: task.titre || task.description }; // Use titre, fallback to description
          const promise = this.http.post<any>('http://localhost:5053/api/Ressource/rechercher', payload)
            .toPromise()
            .then(response => {
              if (response && response.resultats) {
                this.actionableTaskSuggestions.push({
                  id: task.tacheId,
                  description: task.titre, // Or a more detailed description if available
                  suggestions: response.resultats
                });
              }
            })
            .catch(error => {
              console.error(`Error fetching suggestions for task "${task.titre}":`, error);
              // Optionally add task with empty suggestions or an error message
            });
          taskSuggestionPromises.push(promise);
        }
      });
    });

    // 2. Get suggestions for unachieved SMART goals
    this.smartGoals.forEach(goal => {
      if (!goal.etat) { // etat is false for unachieved goals
        const payload = { task_description: goal.description };
        const promise = this.http.post<any>('http://localhost:5053/api/Ressource/rechercher', payload)
          .toPromise()
          .then(response => {
            if (response && response.resultats) {
              this.actionableGoalSuggestions.push({
                id: goal.objectifId,
                description: goal.description,
                suggestions: response.resultats
              });
            }
          })
          .catch(error => {
            console.error(`Error fetching suggestions for goal "${goal.description}":`, error);
          });
        goalSuggestionPromises.push(promise);
      }
    });

    Promise.all([...taskSuggestionPromises, ...goalSuggestionPromises]).finally(() => {
      this.isLoadingAutomaticSuggestions = false;
      console.log('Automatic task suggestions:', this.actionableTaskSuggestions);
      console.log('Automatic goal suggestions:', this.actionableGoalSuggestions);
    });
  }
    // Renamed from fetchPerformanceTrendData
    processPerformanceTrendData(year: number): void {
      this.isLoadingTrendData = true; // Indicate processing started
      console.log(`Processing performance trend data for year: ${year}`);
  
      // Initialize the chart data for the 12 months with zeros
      const monthlyDataForChart = Array(12).fill(0);
  
      // Filter the stored monthly data for the selected year
      const yearStr = year.toString();
      this.monthlyTaskCompletionData.forEach(monthlyEntry => {
        // Check if the entry's month string starts with the selected year
        if (monthlyEntry.mois.startsWith(yearStr + '-')) {
          // Extract the month number (1-12)
          const monthIndex = parseInt(monthlyEntry.mois.split('-')[1], 10) - 1; // Month is 0-indexed for array
  
          // Ensure the month index is valid (0-11)
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyDataForChart[monthIndex] = monthlyEntry.nombreTaches;
          } else {
            console.warn(`Invalid month found in data: ${monthlyEntry.mois}`);
          }
        }
      });
  
      // Update the chart dataset
      this.performanceLineChartData.datasets[0].data = monthlyDataForChart;
  
      this.isLoadingTrendData = false; // Indicate processing finished
      console.log(`Processed performance trend data for ${year}:`, monthlyDataForChart);
  
      // Note: ng2-charts should update automatically. If not, inject BaseChartDirective
      // using @ViewChild and call this.chart.update();
    }
  

  calculateStatistics(): void {
    this.totalProjects = this.assignedProjects.length;
    this.totalIncompleteTasks = this.assignedProjects.reduce((sum, project) => sum + project.nombreTachesACompleter, 0);
    this.totalCompletedTasks = this.assignedProjects.reduce((sum, project) => sum + project.nombreTachesCompletes, 0);
  }
  toggleTaskCompletion(task: Task): void {
    const taskId = task.tacheId; // L'ID de la tâche à partir de l'objet Task
    const url = `http://localhost:5053/api/Tache/terminer/${taskId}`;
    this.http.put(url, {}).subscribe(
      (response: any) => {
        if (response.message === "Tâche terminée avec succès.") {
          
          this.fetchProjectsAndTasks();
          this.calculateStatistics(); 
        
        }
      },
      (error) => {
        console.error('Erreur lors de la mise à jour du statut de la tâche', error);
      }
    );
  }
  fetchEmployeeData(): void {
    // Logique pour récupérer projets, réunions, objectifs...
    console.log('Fetching other employee data...');
    // Simuler la fin du chargement pour l'exemple
    // this.isLoadingProjects = false;
    // this.isLoadingMeetings = false;
    // this.isLoadingGoals = false;
  }





  // Méthode appelée lors du changement d'année dans le select
  onYearChange(): void {
    this.processPerformanceTrendData(this.selectedYear);
  }



  toggleGoalCompletion(goal: SmartGoal): void {
    const objId = goal.objectifId; 
    const url = `http://localhost:5053/api/ObjSmart/terminer/${objId}`;
    
    this.http.put(url, {}).subscribe(
      (response: any) => {
        // Vérifiez ici la réponse complète
        console.log('Réponse du serveur:', response);
        
        if (response.message === 'obj terminée avec succès.') {
          this.fetchProjectsAndTasks();
        } else {
          console.error('Erreur dans la réponse du serveur:', response);
        }
      },
      (error) => {
        console.error('Erreur lors de la mise à jour du statut de l\'objectif', error);
      }
    );
  }
  

  submitComplaint(): void {
   const description = this.complaintText.trim();
    if (!description) {
      alert('Veuillez écrire votre réclamation avant de l\'envoyer.');
      return;
    } 
    if (!this.employeId) {
      alert('Erreur: Impossible d\'identifier l\'employé. Veuillez vous reconnecter.');
      console.error('Employee ID is missing for complaint submission.');
      return;
    }
     const complaintData = {
      employeId: this.employeId,
      description: description
    };

    this.http.post('http://localhost:5053/api/Reclamation/add', complaintData).subscribe({
      next: (response: any) => {
        console.log('Réclamation envoyée avec succès:', response);
        alert(response.message || 'Votre réclamation a été envoyée avec succès.');
        this.complaintText = ''; // Clear the textarea
        this.showComplaintForm = false; // Optionally close the form
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de la réclamation:', err);
        alert('Une erreur est survenue lors de l\'envoi de votre réclamation. Veuillez réessayer.');
      }
    });
  }
  toggleComplaintForm(): void {
    this.showComplaintForm = !this.showComplaintForm;
  
  }

  // Optional: Method to close the modal when clicking the overlay background
  closeComplaintFormOnClickOutside(event: MouseEvent): void {
    // Check if the click target is the overlay itself (not the content inside)
    if ((event.target as HTMLElement).classList.contains('complaint-modal-overlay')) {
      this.showComplaintForm = false;
    }
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
