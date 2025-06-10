import { Component,OnInit,AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

interface DashboardOverviewData {
  totalEmployees: number;
  newHiresThisMonth: number;
  departures: number;
  openJobOffers: number;
}
interface MonthlyStat {
  month: number;
  newHires: number;
  departures: number;
}

interface MonthlyStatsResponse {
  year: number;
  monthlyStats: MonthlyStat[];
}
interface DepartementEmployesStat {
  nomDepartement: string;
  nombreEmployes: number;
}
interface Project {
  id: number;
  nom: string;
  dateDebut: string;
  dateFin: string;
  progression: number;
  statut: string;
}
interface ClassifiedProjectByYearResponse {
  annee: number;
  projets: Project[];
  enCours: number;
  termines: number;
  nonTermines: number;
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit,AfterViewInit {

   dashboardData?: DashboardOverviewData;
  private apiUrl = 'http://localhost:5053/api/AdminDash/overview';
  private statsApiUrlBase = 'http://localhost:5053/api/AdminDash/stats';
    private departementsApiUrl = 'http://localhost:5053/api/AdminDash/departements-employes';
     private projectsApiUrlBase = 'http://localhost:5053/api/AdminDash/classifiedProjectByYear';
  currentYearForStats: number | null = new Date().getFullYear(); // For Line chart

  // ... autres propriétés
barChartDisplayYear: number | null = new Date().getFullYear();
// ...

  lineChart!: Chart<"line", number[], string | number>;
  barChart!: Chart<"bar", number[], string | number>;
  pieChart!: Chart<"pie", number[], string | number>;
    constructor(private http: HttpClient, private router: Router) {}
  ngOnInit() {
    this.fetchDashboardData();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  fetchDashboardData(): void {
    
    this.http.get<DashboardOverviewData>(this.apiUrl).subscribe({
      next: (data) => {
        this.dashboardData = data;
        console.log('Dashboard data loaded:', data);
      },
      error: (error) => {
        console.error('Error fetching dashboard data:', error);
        // Optionally, you could set dashboardData to default values or show an error message
        // For example:
        // this.dashboardData = { totalEmployees: 0, newHiresThisMonth: 0, departures: 0, openJobOffers: 0 };
      }
    });
  }
  initCharts() {
    //  **Line Chart**
  if (this.currentYearForStats) {
      this.fetchAndInitializeLineChart(this.currentYearForStats);
    }

    //  **Bar Chart**
    this.fetchAndInitializeProjectBarChart(this.  barChartDisplayYear);


    //  **Pie Chart**
    const pieCanvas = document.getElementById("pieChart") as HTMLCanvasElement;
    if (pieCanvas) {
   this.http.get<DepartementEmployesStat[]>(this.departementsApiUrl).subscribe({
        next: (apiData) => {
          if (this.pieChart) {
            this.pieChart.destroy();
          }

          const labels = apiData.map(stat => stat.nomDepartement);
          const data = apiData.map(stat => stat.nombreEmployes);
          
          // Modern color palette
  
          

          this.pieChart = new Chart(pieCanvas.getContext("2d")!, {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                label: 'Nombre d\'Employés',
                data: data,
            
                hoverOffset: 0, // No change on hover
                borderColor: '#fff', // White border for segments
                borderWidth: 2       // Border width
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
              title: {
  display: true,
  text: ' Répartition des Employés par Département', // Added a Unicode icon for a subtle visual cue
  font: {
    size: 19, // Slightly increased size for better prominence
    weight: '600', // A semi-bold weight often looks more refined than full bold
    family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" // A clean, modern font stack
  },
  padding: {
    top: 20, // Adjusted padding for a more balanced and spacious look
    bottom: 20
  },
  color: '#2c3e50', // A deep, modern color like a dark slate blue or charcoal
  align: 'start' as 'start' // Aligning the title to the left (start) is a common modern practice
},

                legend: {
                  position: 'bottom', // Legend at the bottom
                  labels: { font: { size: 12 }, boxWidth: 15, padding: 20 }
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  titleFont: { size: 14, weight: 'bold' },
                  bodyFont: { size: 12 },
                  padding: 10,
                  cornerRadius: 4,
                  callbacks: {
                    label: function(context) {
                      let label = context.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed !== null) {
                        label += context.parsed + (context.parsed === 1 ? ' employé' : ' employés');
                      }
                      return label;
                    }
                  }
                }
              }
            }
          });
        },
        error: (error) => {
          console.error('Error fetching pie chart data:', error);
          if (this.pieChart) {
            this.pieChart.destroy();
          }
          // Display a placeholder or error message on the chart
          this.pieChart = new Chart(pieCanvas.getContext("2d")!, {
            type: 'pie',
            data: { 
              labels: ['Erreur de chargement'], 
              datasets: [{ data: [1], backgroundColor: ['#D3D3D3'] }] 
            },
            options: { 
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                title: { display: true, text: 'Données de répartition non disponibles', font: {size: 16}, color: '#888' } 
              } 
            }
          });
        }
      });
    }
  }
 fetchAndInitializeProjectBarChart(yearToDisplay: number | null): void {

    const barCanvas = document.getElementById("barChart") as HTMLCanvasElement;
    if (!barCanvas) {
      console.error('Bar chart canvas element not found!');
      return;
    }
 const targetYear = yearToDisplay !== null ? yearToDisplay : new Date().getFullYear();
    const projectsApiUrlWithYear = `${this.projectsApiUrlBase}?annee=${targetYear}`; // API expects 'annee'

   this.http.get<ClassifiedProjectByYearResponse>(projectsApiUrlWithYear).subscribe({
      next: (projectDataForYear) => { 
        
        if (this.barChart) { // Destroy existing chart instance
          this.barChart.destroy();
        }
         console.log(`Données des projets pour l'année ${targetYear} reçues:`, projectDataForYear);

        // Check if data for the year was found and if it contains projects
        if (!projectDataForYear || !projectDataForYear.projets || projectDataForYear.projets.length === 0) {
          console.warn(`Aucune donnée de projet trouvée pour l'année ${targetYear} dans la réponse de l'API.`);
          this.initializeEmptyBarChart(barCanvas, targetYear);
          return;
        }
      
        const MIN_VISIBLE_PROGRESSION = 0.5; 
        // Use filteredProjects to generate labels, progressions, and colors
        const projectsToDisplay = projectDataForYear.projets;
        const projectLabels = projectsToDisplay.map(p => p.nom);
        const projectProgressions = projectsToDisplay.map(p => p.progression === 0 ? MIN_VISIBLE_PROGRESSION : p.progression);
        const projectBackgroundColors = projectsToDisplay.map(p => {
          switch (p.statut.toLowerCase()) {
            case 'en cours':
              return 'rgba(54, 162, 235, 0.7)'; // Blue
            case 'terminé':
          
              return 'rgba(58, 216, 137, 0.7)'; // Green
            case 'non terminé':
            case 'non termine': // Handle variations
            case 'en retard': // Example for another status
              return 'rgba(255, 99, 132, 0.7)'; // Red
            default:
              return 'rgba(201, 203, 207, 0.7)'; // Grey
          }
        });

        const projectBorderColors = projectBackgroundColors.map(color => color.replace('0.7', '1')); // Make border solid

        this.barChart = new Chart(barCanvas.getContext("2d")!, {
          type: 'bar', // Will be horizontal due to indexAxis: 'y'
          data: {
            labels: projectLabels,
            datasets: [{
              label: 'Progression du Projet (%)',
              data: projectProgressions,
              backgroundColor: projectBackgroundColors,
              hoverBackgroundColor: projectBackgroundColors, // No change on hover
              borderColor: projectBorderColors,
              hoverBorderColor: projectBorderColors, // No change on hover
              borderWidth: 1
            }]
          },
          options: {
            indexAxis: 'y', // This makes the bar chart horizontal
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                beginAtZero: true,
                max: 100, // Progression is likely a percentage
                title: {
                  display: true,
                  text: 'Progression (%)'
                }
              },
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              title: {
                display: true,
              text: `Statistiques des Projets - ${targetYear}`,
                align: 'start',
                font: { size: 16, weight: 'bold' }, // Titre principal un peu plus grand
                padding: { top: 10, bottom: 12 }, // Moins de padding en bas pour rapprocher le sous-titre
                color: '#333'
              },
              subtitle: {
                display: true,
              
               text: `⏳ En cours: ${projectDataForYear.enCours}   •   ✅ Terminés: ${projectDataForYear.termines}   •   ❌ Non Terminés: ${projectDataForYear.nonTermines}`,
                font: { size: 14,weight: 'bold' },
                padding: { top: 0, bottom: 15 }, // Espace après le sous-titre
                color: '#555'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                const project = projectsToDisplay[context.dataIndex]; 

                    if (!project) return 'Données indisponibles';
                    return [
                      `Projet: ${project.nom}`,
                      `Progression: ${project.progression}%`,
                      `Statut: ${project.statut}`,
                      `Début: ${new Date(project.dateDebut).toLocaleDateString()}`,
                      `Date Limite: ${new Date(project.dateFin).toLocaleDateString()}`
                    ];
                  }
                }
              }
            }
          }
        });
      },
      error: (error) => {
        console.error('Error fetching project data for bar chart:', error);
        console.error(`Error fetching project data for year ${targetYear}:`, error);
        // If there's an error (e.g., 404 if API doesn't return data for a year but an error)
        // you might want to display an empty chart as well.
        this.initializeEmptyBarChart(barCanvas, targetYear);
        // Optionally display an error message on the chart
      }
    });
  }

  initializeEmptyBarChart(canvas: HTMLCanvasElement, year: number): void {
    if (this.barChart) {
      this.barChart.destroy();
    }
    this.barChart = new Chart(canvas.getContext("2d")!, {
      type: 'bar',
      data: {
        labels: ['Aucun projet pour cette année'],
        datasets: [{
          label: 'Progression du Projet (%)',
          data: [0],
          backgroundColor: ['rgba(201, 203, 207, 0.7)'],
          borderColor: ['rgba(201, 203, 207, 1)'],
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: `État d'Avancement des Projets - ${year}`, align: 'start', font: {size: 16, weight: 'bold'} },
          subtitle: { display: true, text: 'Aucune donnée de projet disponible.', font: {size: 13, style: 'italic'} }
        },
        scales: { x: { beginAtZero: true, max: 100 } }
      }
    });
  }
fetchAndInitializeLineChart(year: number): void {
    this.http.get<MonthlyStatsResponse>(`${this.statsApiUrlBase}?year=${year}`).subscribe({
      next: (apiData) => {
        const lineCanvas = document.getElementById("lineChart") as HTMLCanvasElement;
        if (!lineCanvas) {
          console.error('Line chart canvas element not found!');
          return;
        }

        if (this.lineChart) {
          this.lineChart.destroy(); // Destroy previous instance before creating a new one
        }

        let labels: string[] = [];
        let hiresData: number[] = [];
        let departuresData: number[] = [];
        const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

        if (apiData && apiData.monthlyStats && apiData.monthlyStats.length > 0) {
          const sortedStats = [...apiData.monthlyStats].sort((a, b) => a.month - b.month);
          labels = sortedStats.map(stat => monthNames[stat.month - 1]);
          hiresData = sortedStats.map(stat => stat.newHires);
          departuresData = sortedStats.map(stat => stat.departures);
        } else {
          console.warn(`No monthly stats data received for year ${year}. Displaying empty chart for all months.`);
          labels = monthNames; // Default to all 12 months
          hiresData = Array(12).fill(0);
          departuresData = Array(12).fill(0);
        }

        this.lineChart = new Chart(lineCanvas.getContext("2d")!, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              { 
                label: "Embauches", 
                data: hiresData, 
                borderColor: "#3498db", 
                pointBackgroundColor: "#3498db",
                pointHoverBackgroundColor: "#3498db", // No change on hover
                pointHoverBorderColor: "#3498db",    // No change on hover
                fill: false, tension: 0.1 },
              { 
                label: "Départs", 
                data: departuresData, 
                borderColor: "#e74c3c", 
                pointBackgroundColor: "#e74c3c",
                pointHoverBackgroundColor: "#e74c3c", // No change on hover
                pointHoverBorderColor: "#e74c3c",    // No change on hover
                fill: false, tension: 0.1 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, // Ensure y-axis shows whole numbers
            plugins: {     title: {
                display: true,
              text: `Statistiques des Projets - ${this.currentYearForStats}`,
                align: 'start',
                font: { size: 16, weight: 'bold' }, // Titre principal un peu plus grand
                padding: { top: 10, bottom: 12 }, // Moins de padding en bas pour rapprocher le sous-titre
                color: '#333'
              },}
          }
        });
      },
      error: (error) => {
        console.error(`Error fetching line chart stats for year ${year}:`, error);
        // Optionally, display an error message on the chart or initialize with empty/default data
      }
    });
  }
    updateChartForYear(): void {
    if (this.currentYearForStats && Number.isInteger(this.currentYearForStats) && this.currentYearForStats > 1900 && this.currentYearForStats < 2200) { // Basic validation
      this.fetchAndInitializeLineChart(this.currentYearForStats);
    } else {
      console.warn('Invalid year entered. Please enter a valid year.');
      // Optionally, provide user feedback (e.g., an alert or a message on the page)
    }
  }
  // ... autres méthodes
updateBarChartData(): void {
  // Validate the year before refreshing
  if (this.barChartDisplayYear && Number.isInteger(this.barChartDisplayYear) && this.barChartDisplayYear > 1900 && this.barChartDisplayYear < 2200) {
    this.fetchAndInitializeProjectBarChart(this.barChartDisplayYear);
  } else {
    console.warn('Année invalide pour le graphique à barres. Veuillez saisir une année valide.');
    // Optionally, refresh with a default year or do nothing
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
