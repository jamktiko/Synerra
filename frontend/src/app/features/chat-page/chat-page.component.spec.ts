import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ChatPageComponent } from './chat-page.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('ChatPageComponent', () => {
  // Component instance - the actual ChatPageComponent we're testing
  let component: ChatPageComponent;
  // Fixture - a wrapper around the component that provides testing utilities
  // like detectChanges() to trigger change detection manually
  let fixture: ComponentFixture<ChatPageComponent>;

  // beforeEach runs before each test case (each 'it' block)
  // This ensures each test starts with a fresh, isolated component instance
  beforeEach(async () => {
    // Mock ActivatedRoute to simulate URL parameters without real routing
    // This is needed because ChatPageComponent expects route params (like room ID)
    const mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ id: 'test-room-123' }),
      },
      // IMPORTANT: paramMap must be an observable so that .subscribe() works
      paramMap: of(convertToParamMap({ id: 'test-room-123' })),
    };

    // Configure the testing module - like setting up a mini Angular app for testing
    await TestBed.configureTestingModule({
      imports: [ChatPageComponent], // Import the standalone component
      providers: [
        // Replace real ActivatedRoute with our mock
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        // Provide HTTP testing infrastructure (mocks HTTP calls)
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      // NO_ERRORS_SCHEMA tells Angular to ignore unknown elements/attributes
      // Useful when we don't want to import every child component
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents(); // Compile the component's template and styles

    // Create an instance of the component for testing
    fixture = TestBed.createComponent(ChatPageComponent);
    component = fixture.componentInstance;
    // Trigger Angular's change detection to initialize the component
    // This runs ngOnInit and renders the template
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    // Most basic test - verifies the component can be created without errors
    // toBeTruthy() checks that the value is not null, undefined, false, 0, '', or NaN
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      expect(component).toBeDefined();
    });
  });

  describe('Layout and Structure', () => {
    // Query the DOM to verify the layout container exists in the rendered template
    // fixture.debugElement gives us access to the component's DOM
    // By.css() is Angular's way to select elements (similar to document.querySelector)
    it('should render layout element', () => {
      const layout = fixture.debugElement.query(By.css('.layout'));
      expect(layout).toBeTruthy();
    });

    it('should render social-menu container', () => {
      const socialMenu = fixture.debugElement.query(By.css('.social-menu'));
      expect(socialMenu).toBeTruthy();
    });

    it('should render app-chat element', () => {
      const chatElement = fixture.debugElement.query(By.css('app-chat'));
      expect(chatElement).toBeTruthy();
    });

    it('should contain exactly one app-chat element', () => {
      // queryAll returns an array of all matching elements (vs query which returns first match)
      const chatElements = fixture.debugElement.queryAll(By.css('app-chat'));
      expect(chatElements.length).toBe(1);
    });

    // Test hierarchical structure - verify app-chat is nested inside social-menu
    it('app-chat should be inside social-menu', () => {
      const socialMenu = fixture.debugElement.query(By.css('.social-menu'));
      // Query within the social-menu element specifically
      const chatElement = socialMenu.query(By.css('app-chat'));
      expect(chatElement).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    // Verify this is a simple wrapper component with no custom business logic
    it('should be a simple wrapper without custom logic', () => {
      // Use reflection to inspect the component's methods
      // Object.getPrototypeOf() gets the component class
      // Object.getOwnPropertyNames() lists all methods on the class
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(component)
      ).filter(
        (name) =>
          // Filter out Angular lifecycle hooks and constructor
          name !== 'constructor' &&
          name !== 'ngOnInit' &&
          typeof (component as any)[name] === 'function'
      );
      // Expect no custom methods beyond what Angular provides
      expect(methods.length).toBe(0);
    });
  });
});
