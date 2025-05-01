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
  currentKpiValue: number = 75;
  public kpiGaugeData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Atteint', 'Restant'],
    datasets: [{
      data: [this.currentKpiValue, 100 - this.currentKpiValue],
      backgroundColor: ['#28a745', '#e9ecef'], // Vert pour atteint, Gris pour restant
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
    this.fetchKpiData();
  
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

          this.processPerformanceTrendData(this.selectedYear);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des projets et tâches', err);
        }
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

  fetchKpiData(): void {
    
    const employeeId = '123'; // Obtenir l'ID réel
    // Simuler un appel API
    setTimeout(() => {
      this.currentKpiValue = Math.floor(Math.random() * (95 - 60 + 1)) + 60; // Valeur aléatoire pour démo
      this.kpiGaugeData.datasets[0].data = [this.currentKpiValue, 100 - this.currentKpiValue];
    
      console.log('KPI fetched:', this.currentKpiValue);
    }, 1200); // Simuler délai réseau
    /*
    this.http.get<{ kpiValue: number }>(`/api/employees/${employeeId}/kpi`)
      .subscribe({
        next: (response) => {
          this.currentKpiValue = response.kpiValue;
          this.kpiGaugeData.datasets[0].data = [this.currentKpiValue, 100 - this.currentKpiValue];
          this.isLoadingKpi = false;
        },
        error: (err) => {
          console.error('Error fetching KPI:', err);
          this.isLoadingKpi = false;
        }
      });
      */
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
    if (this.complaintText.trim()) {
      // In a real app, you would send this complaint to the admin/backend
      console.log('Réclamation envoyée:', this.complaintText);
      alert('Votre réclamation a été envoyée.'); // Simple feedback
      this.complaintText = ''; // Clear the textarea
    } else {
      alert('Veuillez écrire votre réclamation avant de l\'envoyer.');
    }
  }
  toggleComplaintForm(): void {
    this.showComplaintForm = !this.showComplaintForm;
    if (this.showComplaintForm) {
      // Optional: Clear text when opening
      // this.complaintText = '';
    }
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
