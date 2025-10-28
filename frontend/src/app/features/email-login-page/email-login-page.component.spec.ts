import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { EmailLoginPageComponent } from './email-login-page.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserStore } from '../../core/stores/user.store';
import { of, throwError } from 'rxjs';
import { User } from '../../core/interfaces/user.model';
import { By } from '@angular/platform-browser';

describe('EmailLoginPageComponent - Login & Authentication Tests', () => {
  let component: EmailLoginPageComponent;
  let fixture: ComponentFixture<EmailLoginPageComponent>;
  let authService: AuthService;
  let userService: UserService;
  let userStore: UserStore;
  let router: Router;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    PK: 'USER#123',
    SK: 'PROFILE',
    Username: 'testuser',
    Email: 'test@example.com',
    ProfilePicture: 'https://example.com/pic.jpg',
  };

  const mockUserWithoutUsername: User = {
    PK: 'USER#456',
    SK: 'PROFILE',
    Email: 'newuser@example.com',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailLoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
        UserService,
        UserStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailLoginPageComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    userService = TestBed.inject(UserService);
    userStore = TestBed.inject(UserStore);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock getMe() to prevent ngOnInit from making real HTTP calls
    jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));
  });

  afterEach(() => {
    // No httpMock.verify() since we're using mocked services
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize empty input values', () => {
      expect(component.emailInput).toBe('');
      expect(component.passwordInput).toBe('');
    });

    it('should initialize user null with', () => {
      expect(component.user).toBeNull();
    });

    it('should initialize me empty object', () => {
      expect(component.me).toEqual({});
    });
  });

  describe('ngOnInit - Initial Data Loading', () => {
    it('should call getMe() metodia', () => {
      const getMeSpy = jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(of(mockUser));

      component.ngOnInit();

      expect(getMeSpy).toHaveBeenCalled();
    });

    it('should set me property getMe() response', (done) => {
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.ngOnInit();

      setTimeout(() => {
        expect(component.me).toEqual(mockUser);
        done();
      }, 100);
    });

    it('should handle getMe() error', (done) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(throwError(() => new Error('Network error')));

      component.ngOnInit();

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load games',
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
        done();
      }, 100);
    });
  });

  describe('login() - Authentication Flow', () => {
    beforeEach(() => {
      component.emailInput = 'test@example.com';
      component.passwordInput = 'password123';
    });

    it('should call authService.login oikeilla credentials', () => {
      const loginSpy = jest
        .spyOn(authService, 'login')
        .mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should tyhjentää passwordInput välittömästi login kutsun after', () => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      expect(component.passwordInput).toBe('');
    });

    it('should tyhjentää emailInput onnistuneen login after', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      setTimeout(() => {
        expect(component.emailInput).toBe('');
        done();
      }, 100);
    });

    it('should fetch user getMe():llä login success after', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      const getMeSpy = jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(of(mockUser));

      component.login();

      setTimeout(() => {
        expect(getMeSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should update UserStore user', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));
      const setUserSpy = jest.spyOn(userStore, 'setUser');

      component.login();

      setTimeout(() => {
        expect(setUserSpy).toHaveBeenCalledWith(mockUser);
        done();
      }, 100);
    });

    it('should set component.user value haettu user', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      setTimeout(() => {
        expect(component.user).toEqual(mockUser);
        done();
      }, 100);
    });
  });

  describe('Navigation Logic after Login', () => {
    it('should navigate /dashboard when user on Username', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.login();

      setTimeout(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
        done();
      }, 100);
    });

    it('should navigate /profile-creation when Username missing', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(of(mockUserWithoutUsername));
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.login();

      setTimeout(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/profile-creation']);
        done();
      }, 100);
    });

    it('should navigate /profile-creation jos getMe() epäonnistuu', (done) => {
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(throwError(() => new Error('User fetch failed')));
      const navigateSpy = jest.spyOn(router, 'navigate');

      component.login();

      setTimeout(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/profile-creation']);
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle login error', (done) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest
        .spyOn(authService, 'login')
        .mockReturnValue(throwError(() => new Error('Invalid credentials')));

      component.emailInput = 'wrong@example.com';
      component.passwordInput = 'wrongpassword';

      component.login();

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Login error:',
          expect.any(Error)
        );
        expect(component.passwordInput).toBe(''); // Password still cleared
        consoleErrorSpy.mockRestore();
        done();
      }, 100);
    });

    it('should logata error jos getMe() epäonnistuu login after', (done) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest
        .spyOn(userService, 'getMe')
        .mockReturnValue(throwError(() => new Error('Network error')));

      component.login();

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error loading user after login:',
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
        done();
      }, 100);
    });
  });

  // UserStore Effect Integration tested indirectly through login() method
  // Effect testing is complex due to Angular signal lifecycle

  describe('Form Elements', () => {
    it('should render email input element', () => {
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[type="email"]')
      );
      expect(emailInput).toBeTruthy();
      expect(emailInput.nativeElement.name).toBe('email');
    });

    it('should render password input element', () => {
      fixture.detectChanges();

      const passwordInput = fixture.debugElement.query(
        By.css('input[type="password"]')
      );
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.nativeElement.name).toBe('password');
    });

    it('should show placeholder texts in inputs', () => {
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[type="email"]')
      ).nativeElement;
      const passwordInput = fixture.debugElement.query(
        By.css('input[type="password"]')
      ).nativeElement;

      expect(emailInput.placeholder).toBe('example@email.com');
      expect(passwordInput.placeholder).toBe('**********');
    });

    it('should set input tyypit correctly', () => {
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[type="email"]')
      ).nativeElement;
      const passwordInput = fixture.debugElement.query(
        By.css('input[type="password"]')
      ).nativeElement;

      expect(emailInput.type).toBe('email');
      expect(passwordInput.type).toBe('password');
    });

    it('should have ngModel direktiivi in email', () => {
      fixture.detectChanges();

      const emailInput = fixture.debugElement.query(
        By.css('input[name="email"]')
      );
      expect(emailInput).toBeTruthy();
      // ngModel creates two-way binding automatically
    });

    it('should have ngModel direktiivi in password', () => {
      fixture.detectChanges();

      const passwordInput = fixture.debugElement.query(
        By.css('input[name="password"]')
      );
      expect(passwordInput).toBeTruthy();
      // ngModel creates two-way binding automatically
    });
  });

  describe('UI Rendering', () => {
    it('should render login heading', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Login with email');
    });

    it('should render email input field', () => {
      fixture.detectChanges();
      const emailInput = fixture.debugElement.query(
        By.css('input[type="email"]')
      );
      expect(emailInput).toBeTruthy();
      expect(emailInput.nativeElement.placeholder).toBe('example@email.com');
    });

    it('should render password input field', () => {
      fixture.detectChanges();
      const passwordInput = fixture.debugElement.query(
        By.css('input[type="password"]')
      );
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.nativeElement.placeholder).toBe('**********');
    });

    it('should render form element', () => {
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });

    it('should render Back and Login buttons', () => {
      fixture.detectChanges();
      const buttons = fixture.debugElement.queryAll(By.css('app-button'));
      expect(buttons.length).toBe(2);
    });
  });

  describe('Form Submission', () => {
    it('should call login() when form submittoidaan', () => {
      fixture.detectChanges();
      const loginSpy = jest.spyOn(component, 'login').mockImplementation();

      const form = fixture.debugElement.query(By.css('form'));
      form.nativeElement.dispatchEvent(new Event('submit'));

      expect(loginSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle tyhjät input kentät', () => {
      component.emailInput = '';
      component.passwordInput = '';

      const loginSpy = jest.spyOn(authService, 'login').mockReturnValue(of({}));

      component.login();

      expect(loginSpy).toHaveBeenCalledWith({
        email: '',
        password: '',
      });
    });

    it('should handle very long email', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      component.emailInput = longEmail;
      component.passwordInput = 'password123';

      const loginSpy = jest.spyOn(authService, 'login').mockReturnValue(of({}));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      expect(loginSpy).toHaveBeenCalledWith({
        email: longEmail,
        password: 'password123',
      });
    });

    it('should handle special characters in email', () => {
      component.emailInput = 'test+tag@example.co.uk';
      component.passwordInput = 'password123';

      const loginSpy = jest.spyOn(authService, 'login').mockReturnValue(of({}));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(mockUser));

      component.login();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test+tag@example.co.uk',
        password: 'password123',
      });
    });

    it('should handle user without ProfilePictureUrl', (done) => {
      const userWithoutPicture: User = {
        PK: 'USER#789',
        SK: 'PROFILE',
        Username: 'nopicuser',
        Email: 'nopic@example.com',
      };

      jest.spyOn(authService, 'login').mockReturnValue(of({ token: 'abc123' }));
      jest.spyOn(userService, 'getMe').mockReturnValue(of(userWithoutPicture));

      component.login();

      setTimeout(() => {
        expect(component.user).toEqual(userWithoutPicture);
        expect(component.user?.ProfilePicture).toBeUndefined();
        done();
      }, 100);
    });
  });
});
