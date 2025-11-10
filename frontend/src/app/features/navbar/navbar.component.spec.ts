import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';
import { UserStore } from '../../core/stores/user.store';
import { AuthStore } from '../../core/stores/auth.store';
import { Router } from '@angular/router';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

xdescribe('NavbarComponent - UI & Rendering Tests', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let userStore: UserStore;
  let authStore: AuthStore;
  let router: Router;
  let compiled: DebugElement;

  const mockUser = {
    PK: 'USER#user123',
    SK: 'USER#user123',
    UserId: 'user123',
    Username: 'TestUser',
    Email: 'test@example.com',
    ProfilePicture: 'assets/default-avatar.png',
    PlayedGames: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [UserStore, AuthStore],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    compiled = fixture.debugElement;

    // Mock localStorage
    let store: { [key: string]: string } = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => store[key] || null,
      setItem: (key: string, value: string): void => {
        store[key] = value;
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        store = {};
      },
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==================== RENDERING TESTS ====================

  describe('Component Rendering', () => {
    it('should create the navbar component', () => {
      expect(component).toBeTruthy();
    });

    it('should render navigation element with correct class', () => {
      fixture.detectChanges();
      const navElement = compiled.query(By.css('nav.navigation'));
      expect(navElement).toBeTruthy();
    });

    it('should render logo container', () => {
      fixture.detectChanges();
      const logoContainer = compiled.query(By.css('.logo-container'));
      expect(logoContainer).toBeTruthy();
    });

    it('should render both big and small logo images', () => {
      fixture.detectChanges();
      const bigLogo = compiled.query(By.css('.logo--big'));
      const smallLogo = compiled.query(By.css('.logo--small'));

      expect(bigLogo).toBeTruthy();
      expect(smallLogo).toBeTruthy();
      expect(bigLogo.nativeElement.src).toContain('logo_big.svg');
      expect(smallLogo.nativeElement.src).toContain('logo_small.svg');
    });

    it('should render user profile section', () => {
      fixture.detectChanges();
      const userProfile = compiled.query(By.css('.user-profile'));
      expect(userProfile).toBeTruthy();
    });

    it('should render all navigation items', () => {
      fixture.detectChanges();
      const navLinks = compiled.queryAll(By.css('.nav-links .nav-btn'));
      expect(navLinks.length).toBe(4); // Home, Games, Social, Settings
    });

    it('should render logout button', () => {
      fixture.detectChanges();
      const logoutBtn = compiled.query(By.css('.logout-btn'));
      expect(logoutBtn).toBeTruthy();
      expect(logoutBtn.nativeElement.textContent).toContain('Logout');
    });
  });

  // ==================== USER DATA DISPLAY ====================

  describe('User Information Display', () => {
    it('should display user avatar when user is set', () => {
      userStore.setUser(mockUser);
      fixture.detectChanges();

      const avatar = compiled.query(By.css('.avatar'));
      expect(avatar).toBeTruthy();
      expect(avatar.nativeElement.src).toContain(mockUser.ProfilePicture);
    });

    it('should display username when user is set', () => {
      userStore.setUser(mockUser);
      fixture.detectChanges();

      const userName = compiled.query(By.css('.user-name'));
      expect(userName).toBeTruthy();
      expect(userName.nativeElement.textContent).toContain(mockUser.Username);
    });

    it('should display user email when user is set', () => {
      userStore.setUser(mockUser);
      fixture.detectChanges();

      const userEmail = compiled.query(By.css('.user-email'));
      expect(userEmail).toBeTruthy();
      expect(userEmail.nativeElement.textContent).toContain(mockUser.Email);
    });
  });

  // ==================== NAVIGATION ITEMS ====================

  describe('Navigation Items', () => {
    it('should have correct navigation items', () => {
      expect(component.navItems.length).toBe(4);
      expect(component.navItems[0].label).toBe('Home');
      expect(component.navItems[1].label).toBe('Games');
      expect(component.navItems[2].label).toBe('Social');
      expect(component.navItems[3].label).toBe('Settings');
    });

    it('should render navigation items with correct routes', () => {
      fixture.detectChanges();
      const navLinks = compiled.queryAll(By.css('.nav-links .nav-btn'));

      expect(
        navLinks[0].nativeElement.getAttribute('ng-reflect-router-link')
      ).toBe('/dashboard');
      expect(
        navLinks[1].nativeElement.getAttribute('ng-reflect-router-link')
      ).toBe('/dashboard/choose-game');
      expect(
        navLinks[2].nativeElement.getAttribute('ng-reflect-router-link')
      ).toBe('/dashboard/social');
      expect(
        navLinks[3].nativeElement.getAttribute('ng-reflect-router-link')
      ).toBe('/dashboard/settings');
    });

    it('should render icons for each navigation item', () => {
      fixture.detectChanges();
      const navImages = compiled.queryAll(By.css('.nav-links .nav-btn img'));

      expect(navImages.length).toBe(4);
      expect(navImages[0].nativeElement.src).toContain('Home.svg');
      expect(navImages[1].nativeElement.src).toContain('Gamepad.svg');
      expect(navImages[2].nativeElement.src).toContain('NoMessage.svg');
      expect(navImages[3].nativeElement.src).toContain('Settings.svg');
    });
  });

  // ==================== COLLAPSE FUNCTIONALITY ====================

  describe('Collapse/Expand Functionality', () => {
    it('should initialize as not collapsed by default', () => {
      fixture.detectChanges();
      expect(component.isCollapsed).toBe(false);
    });

    it('should apply collapsed class when isCollapsed is true', () => {
      component.isCollapsed = true;
      fixture.detectChanges();

      const navElement = compiled.query(By.css('nav.navigation'));
      expect(navElement.nativeElement.classList.contains('collapsed')).toBe(
        true
      );
    });

    it('should not apply collapsed class when isCollapsed is false', () => {
      component.isCollapsed = false;
      fixture.detectChanges();

      const navElement = compiled.query(By.css('nav.navigation'));
      expect(navElement.nativeElement.classList.contains('collapsed')).toBe(
        false
      );
    });

    it('should toggle collapse state when toggleCollapse is called', () => {
      const initialState = component.isCollapsed;
      component.toggleCollapse();

      expect(component.isCollapsed).toBe(!initialState);
    });

    it('should save collapse state to localStorage', () => {
      component.toggleCollapse();
      const saved = localStorage.getItem('navbarCollapsed');

      expect(saved).toBe(String(component.isCollapsed));
    });

    it('should emit collapsedChange event when toggled', () => {
      jest.spyOn(component.collapsedChange, 'emit');
      component.toggleCollapse();

      expect(component.collapsedChange.emit).toHaveBeenCalledWith(
        component.isCollapsed
      );
    });
  });

  // ==================== RESPONSIVE BEHAVIOR ====================

  describe('Responsive Behavior', () => {
    it('should collapse on small screens (< 900px) on init', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 800,
      });
      component.ngOnInit();

      expect(component.isCollapsed).toBe(true);
    });

    it('should not collapse on large screens (>= 900px) on init', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200,
      });
      component.ngOnInit();

      expect(component.isCollapsed).toBe(false);
    });

    it('should restore saved collapse state from localStorage', () => {
      localStorage.setItem('navbarCollapsed', 'true');
      component.ngOnInit();

      expect(component.isCollapsed).toBe(true);
    });
  });

  // ==================== LOGOUT FUNCTIONALITY ====================

  describe('Logout Functionality', () => {
    it('should clear auth token when logging out', () => {
      jest.spyOn(authStore, 'clearToken');
      component.logOut();

      expect(authStore.clearToken).toHaveBeenCalled();
    });

    it('should navigate to login page when logging out', () => {
      jest.spyOn(router, 'navigate');
      component.logOut();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should trigger logout when logout button is clicked', () => {
      jest.spyOn(component, 'logOut');
      fixture.detectChanges();

      const logoutBtn = compiled.query(By.css('.logout-btn'));
      logoutBtn.nativeElement.click();

      expect(component.logOut).toHaveBeenCalled();
    });
  });

  // ==================== USER INTERACTION ====================

  describe('User Interactions', () => {
    it('should call onUserClick when user profile is clicked', () => {
      jest.spyOn(component, 'onUserClick');
      fixture.detectChanges();

      const userProfile = compiled.query(By.css('.user-profile'));
      userProfile.nativeElement.click();

      expect(component.onUserClick).toHaveBeenCalled();
    });
  });

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    it('should have aria-label on user profile button', () => {
      fixture.detectChanges();
      const userProfile = compiled.query(By.css('.user-profile'));

      expect(userProfile.nativeElement.getAttribute('aria-label')).toBe(
        'User menu'
      );
    });

    it('should have alt text on logo images', () => {
      fixture.detectChanges();
      const bigLogo = compiled.query(By.css('.logo--big'));
      const smallLogo = compiled.query(By.css('.logo--small'));

      expect(bigLogo.nativeElement.alt).toBeTruthy();
      expect(smallLogo.nativeElement.alt).toBeTruthy();
    });

    it('should have alt text on avatar image', () => {
      userStore.setUser(mockUser);
      fixture.detectChanges();

      const avatar = compiled.query(By.css('.avatar'));
      expect(avatar.nativeElement.alt).toBe('User avatar');
    });
  });
});
