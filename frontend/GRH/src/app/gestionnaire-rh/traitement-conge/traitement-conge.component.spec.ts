import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitementCongeComponent } from './traitement-conge.component';

describe('TraitementCongeComponent', () => {
  let component: TraitementCongeComponent;
  let fixture: ComponentFixture<TraitementCongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TraitementCongeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TraitementCongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
