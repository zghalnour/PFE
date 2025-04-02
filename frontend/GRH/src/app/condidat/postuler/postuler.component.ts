import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-postuler',
  templateUrl: './postuler.component.html',
  styleUrl: './postuler.component.css'
})
export class PostulerComponent implements OnInit {

  constructor(private router: Router) { }
  ngOnInit() {

  }
  goHome() {
    this.router.navigate(['/candidat']);  // Redirection vers l'accueil
  }

}
