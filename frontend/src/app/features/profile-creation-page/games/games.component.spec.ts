import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { GamesComponent } from './games.component';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesComponent],
      providers: [
        provideHttpClient(), // For fetching available games from API
        provideHttpClientTesting(), // Mock HTTP responses in tests
        // Modal service - component is rendered inside a Bootstrap modal
        NgbActiveModal,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Smoke test - verifies game selection modal component initializes correctly
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
