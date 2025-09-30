import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerFiltersComponent } from './player-filters.component';

describe('PlayerFiltersComponent', () => {
  let component: PlayerFiltersComponent;
  let fixture: ComponentFixture<PlayerFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
