import { Component,Inject,OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-candidature-details-dialog',
  templateUrl: './candidature-details-dialog.component.html',
  styleUrl: './candidature-details-dialog.component.css'
})
export class CandidatureDetailsDialogComponent {
  displayedColumns: string[] = ['question', 'answer', 'correction'];


  constructor(
    public dialogRef: MatDialogRef<CandidatureDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient 
  ) {}



  close(): void {
    this.dialogRef.close();
  }


  isInProgress(): boolean {
    return this.data.state === 'en cours';
  }

  isFinalState(): boolean {
    return this.data.state === 'accepte' || this.data.state === 'refuse';
  }

  
}

