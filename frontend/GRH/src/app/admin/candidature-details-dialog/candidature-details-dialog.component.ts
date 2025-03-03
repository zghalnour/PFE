import { Component,Inject,OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-candidature-details-dialog',
  templateUrl: './candidature-details-dialog.component.html',
  styleUrl: './candidature-details-dialog.component.css'
})
export class CandidatureDetailsDialogComponent {
  displayedColumns: string[] = ['question', 'answer', 'correction'];



  constructor(
    public dialogRef: MatDialogRef<CandidatureDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}



  close(): void {
    this.dialogRef.close();
  }
  acceptCandidate() {
    this.data.state = 'accepte'; // Mettre à jour l'état du candidat
    console.log('Candidat accepté', this.data);
    // Ajoute la logique d'acceptation ici (par exemple, une mise à jour dans la base de données)
  }

  // Refuse le candidat et met à jour l'état
  rejectCandidate() {
    this.data.state = 'refuse'; // Mettre à jour l'état du candidat
    console.log('Candidat refusé', this.data);
    // Ajoute la logique de rejet ici (par exemple, une mise à jour dans la base de données)
  }

  // Vérifie si l'état est en cours
  isInProgress(): boolean {
    return this.data.state === 'en cours';
  }
}

