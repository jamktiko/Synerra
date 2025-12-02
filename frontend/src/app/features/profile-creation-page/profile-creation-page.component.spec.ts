import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileCreationPageComponent } from './profile-creation-page.component';
import { expect } from '@jest/globals';
import { provideRouter } from '@angular/router';

describe('ProfileCreationPageComponent', () => {
  let component: ProfileCreationPageComponent;
  let fixture: ComponentFixture<ProfileCreationPageComponent>;

  beforeEach(async () => {
    // Configure testing module with HTTP mocking infrastructure
    // This component likely needs HTTP client to save profile data
    await TestBed.configureTestingModule({
      imports: [ProfileCreationPageComponent], // Import standalone component
      providers: [
        provideRouter([]),
        provideHttpClient(), // registers HttpClient
        provideHttpClientTesting(), // testing utilities (mock backend)
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileCreationPageComponent);
    component = fixture.componentInstance;
    // Trigger change detection to initialize component and render template
    fixture.detectChanges();
  });

  // Basic smoke test - verifies component can be instantiated without errors
  // This catches constructor issues, missing dependencies, or template syntax errors
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
