import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: jest.Mocked<Router>;
  let authStore: jest.Mocked<AuthStore>;

  beforeEach(() => {
    // Mocks Router and AuthStore
    router = {
      navigate: jest.fn(),
    } as any;
    authStore = {
      isLoggedIn: jest.fn(),
    } as any;

    guard = new AuthGuard(router, authStore);

    // Mutes the alert in tests
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow activation when user is logged in', () => {
    authStore.isLoggedIn.mockReturnValue(true);

    const result = guard.canActivate();

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block activation and redirect when user is not logged in', () => {
    authStore.isLoggedIn.mockReturnValue(false);

    const result = guard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
