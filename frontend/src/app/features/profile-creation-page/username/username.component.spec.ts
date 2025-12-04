import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UsernameComponent } from './username.component';
import { expect } from '@jest/globals';
import { provideRouter } from '@angular/router';

describe('UsernameComponent', () => {
  let component: UsernameComponent;
  let fixture: ComponentFixture<UsernameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsernameComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        // NgbActiveModal is needed because this component is used in a modal dialog
        // Bootstrap modals require this service to control modal lifecycle (open/close/dismiss)
        NgbActiveModal,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsernameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Basic smoke test for modal component
  // Verifies component can be created with NgbActiveModal dependency
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
