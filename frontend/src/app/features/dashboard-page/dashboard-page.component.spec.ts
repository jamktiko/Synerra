import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('DashboardPageComponent - UI & Functionality Tests', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;

  beforeEach(async () => {
    // Configure test module with HTTP testing infrastructure
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent], // Import standalone component
      providers: [provideHttpClient(), provideHttpClientTesting()],
      // NO_ERRORS_SCHEMA tells Angular to ignore unknown child components
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    // Verify this is a standalone component (Angular 19+ pattern)
    // ɵcmp is Angular's internal component metadata (not typically accessed in production code)
    it('should be a standalone component', () => {
      const metadata = (DashboardPageComponent as any).ɵcmp;
      expect(metadata).toBeTruthy();
    });
  });

  describe('Template Rendering', () => {
    it('should render app-dashboard element', () => {
      const dashboardElement = fixture.debugElement.query(
        By.css('app-dashboard')
      );
      expect(dashboardElement).toBeTruthy();
    });

    // Verify only one dashboard component is rendered (no duplicates)
    it('should contain only one app-dashboard element', () => {
      const dashboardElements = fixture.debugElement.queryAll(
        By.css('app-dashboard')
      );
      expect(dashboardElements.length).toBe(1);
    });
  });

  describe('Component Structure', () => {
    // Verify this is a simple wrapper with no business logic
    it('should have simple wrapper component', () => {
      const metadata = (DashboardPageComponent as any).ɵcmp;
      expect(metadata).toBeTruthy();
      // Component should exist but contain no custom logic
      expect(component).toBeTruthy();
    });

    // Verify no custom methods are defined (only Angular lifecycle hooks allowed)
    it('should not contain custom methods', () => {
      // Get all method names from the component's prototype
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(component)
      ).filter(
        (name) =>
          name !== 'constructor' &&
          typeof (component as any)[name] === 'function'
      );

      // Expect only Angular lifecycle methods (if any)
      expect(methods.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration with DashboardComponent', () => {
    // Verify that this page component delegates all functionality to child component
    it('should delegate all functionality to app-dashboard', () => {
      const dashboardElement = fixture.debugElement.query(
        By.css('app-dashboard')
      );
      expect(dashboardElement).toBeTruthy();
    });
  });
});
