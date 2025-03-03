import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatureDetailsDialogComponent } from './candidature-details-dialog.component';

describe('CandidatureDetailsDialogComponent', () => {
  let component: CandidatureDetailsDialogComponent;
  let fixture: ComponentFixture<CandidatureDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CandidatureDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CandidatureDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
