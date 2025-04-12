import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcoursCandidatComponent } from './parcours-candidat.component';

describe('ParcoursCandidatComponent', () => {
  let component: ParcoursCandidatComponent;
  let fixture: ComponentFixture<ParcoursCandidatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParcoursCandidatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParcoursCandidatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
