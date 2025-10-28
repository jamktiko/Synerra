import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SignupPageComponent } from './signup-page.component';

describe('SignupPageComponent', () => {
  let component: SignupPageComponent;
  let fixture: ComponentFixture<SignupPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        provideHttpClient(), // For signup API calls
        provideHttpClientTesting(), // Mock HTTP responses
        // provideRouter with empty routes - needed because signup likely has
        // navigation logic (e.g., redirect to login after successful signup)
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Smoke test - verifies signup form component renders without errors
  // Catches issues with form initialization, validators, or template syntax
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
