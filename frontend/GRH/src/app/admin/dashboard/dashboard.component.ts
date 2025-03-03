import { Component,OnInit,AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit,AfterViewInit {
  constructor(private http: HttpClient, private router: Router) {}

  lineChart!: Chart<"line", number[], string | number>;
  barChart!: Chart<"bar", number[], string | number>;
  pieChart!: Chart<"pie", number[], string | number>;
  
  ngOnInit() {}

  ngAfterViewInit() {
    this.initCharts();
  }


  initCharts() {
    //  **Line Chart**
    const lineCanvas = document.getElementById("lineChart") as HTMLCanvasElement;
    if (lineCanvas) {
      this.lineChart = new Chart(lineCanvas.getContext("2d")!, {
        type: 'line',
        data: {
          labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
          datasets: [
            { label: "Embauches", data: [5, 10, 15, 7, 12, 20], borderColor: "#3498db", fill: false },
            { label: "Départs", data: [2, 5, 3, 8, 4, 6], borderColor: "#e74c3c", fill: false }
          ]
        }
      });
    }

    //  **Bar Chart**
    const barCanvas = document.getElementById("barChart") as HTMLCanvasElement;
    if (barCanvas) {
      this.barChart = new Chart(barCanvas.getContext("2d")!, {
        type: 'bar',
        data: {
          labels: ["En cours", "Atteints", "Non atteints"],
          datasets: [{
            label: "Objectifs",
            data: [30, 50, 20],
            backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"]
          }]
        }
      });
    }

    //  **Pie Chart (Correction du typage)**
    const pieCanvas = document.getElementById("pieChart") as HTMLCanvasElement;
    if (pieCanvas) {
      this.pieChart = new Chart(pieCanvas.getContext("2d")!, {
        type: 'pie',
        data: {
          labels: ["IT", "RH", "Finance", "Marketing"],
          datasets: [{
            data: [40, 20, 15, 25],
            backgroundColor: ["#3498db", "#e67e22", "#1abc9c", "#9b59b6"]
          }]
        }
      });
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
