import { AuthCallBacksComponent } from './auth-call-backs.component';
import { AuthStore } from '../../core/stores/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserStore } from '../../core/stores/user.store';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AuthCallBacksComponent', () => {
  let component: AuthCallBacksComponent;
  let authStore: AuthStore;
  let authService: AuthService;
  let userService: UserService;
  let userStore: UserStore;
  let notificationService: NotificationService;
  let router: Router;
  let http: HttpClient;

  const navigateSpy = { navigate: jest.fn() };

  beforeEach(() => {
    // Mocking required stores and services
    authStore = { setToken: jest.fn() } as any;
    authService = { logout: jest.fn() } as any;
    userStore = { setUser: jest.fn() } as any;
    notificationService = { initConnection: jest.fn() } as any;
    router = navigateSpy as any;
    userService = { getMe: jest.fn() } as any;
    http = { post: jest.fn() } as any;

    component = new AuthCallBacksComponent(
      authStore,
      authService,
      userService,
      userStore,
      notificationService,
      router,
      http,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should logout and navigate to login if no code in URL', () => {
    jest.spyOn(window, 'URLSearchParams').mockReturnValue({
      get: () => null,
    } as any);

    component.ngOnInit();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle successful token exchange and user fetch with username', () => {
    const mockToken = {
      id_token:
        btoa(JSON.stringify({ header: {} })) +
        '.' +
        btoa(JSON.stringify({ email: 'test@example.com' })) +
        '.signature',
    };
    const mockUser = { Username: 'user1' };

    jest.spyOn(window, 'URLSearchParams').mockReturnValue({
      get: () => 'valid-code',
    } as any);

    (http.post as jest.Mock).mockReturnValue(of({ tokens: mockToken }));
    (userService.getMe as jest.Mock).mockReturnValue(of(mockUser));

    component.ngOnInit();

    expect(authStore.setToken).toHaveBeenCalledWith(mockToken.id_token);
    expect(userStore.setUser).toHaveBeenCalledWith(mockUser);
    expect(notificationService.initConnection).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle successful token exchange and user fetch without username', () => {
    const mockToken = {
      id_token:
        btoa(JSON.stringify({ header: {} })) +
        '.' +
        btoa(JSON.stringify({ email: 'test@example.com' })) +
        '.signature',
    };
    const mockUser = {}; // no Username

    jest.spyOn(window, 'URLSearchParams').mockReturnValue({
      get: () => 'valid-code',
    } as any);

    (http.post as jest.Mock).mockReturnValue(of({ tokens: mockToken }));
    (userService.getMe as jest.Mock).mockReturnValue(of(mockUser));

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/profile-creation']);
  });

  it('should logout and navigate to login if token exchange fails', () => {
    jest.spyOn(window, 'URLSearchParams').mockReturnValue({
      get: () => 'valid-code',
    } as any);

    (http.post as jest.Mock).mockReturnValue(
      throwError(() => new Error('HTTP error')),
    );

    component.ngOnInit();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to profile creation if user fetch fails', () => {
    const mockToken = {
      id_token:
        btoa(JSON.stringify({ header: {} })) +
        '.' +
        btoa(JSON.stringify({ email: 'test@example.com' })) +
        '.signature',
    };

    jest.spyOn(window, 'URLSearchParams').mockReturnValue({
      get: () => 'valid-code',
    } as any);

    (http.post as jest.Mock).mockReturnValue(of({ tokens: mockToken }));
    (userService.getMe as jest.Mock).mockReturnValue(
      throwError(() => new Error('User fetch error')),
    );

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/profile-creation']);
  });
});
