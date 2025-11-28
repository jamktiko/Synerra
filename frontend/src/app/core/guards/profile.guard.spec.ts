import { ProfileGuard } from './profile.guard';
import { Router } from '@angular/router';
import { UserStore } from '../stores/user.store';
import { LoadingPageStore } from '../stores/loadingPage.store';

describe('ProfileGuard', () => {
  let guard: ProfileGuard;
  let router: jest.Mocked<Router>;
  let userStore: jest.Mocked<UserStore>;
  let loadingPageStore: jest.Mocked<LoadingPageStore>;

  beforeEach(() => {
    // Mocks router and required stores
    router = {
      navigate: jest.fn(),
    } as any;

    userStore = {
      user: jest.fn(),
    } as any;

    loadingPageStore = {
      setAuthLayoutLoadingPageVisible: jest.fn(),
    } as any;

    guard = new ProfileGuard(userStore, router, loadingPageStore);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow activation when user has no Username (profile not created)', async () => {
    userStore.user.mockReturnValue({}); // user exists without username (so hasn't created a profile)

    const result = await guard.canActivate();

    expect(result).toBe(true);
    expect(
      loadingPageStore.setAuthLayoutLoadingPageVisible,
    ).toHaveBeenCalledWith(true);
    expect(
      loadingPageStore.setAuthLayoutLoadingPageVisible,
    ).toHaveBeenCalledWith(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block activation and redirect when user has a Username (profile created)', async () => {
    userStore.user.mockReturnValue({ Username: 'Make' });

    const result = await guard.canActivate();

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should block activation and redirect when user not loaded within 2 seconds', async () => {
    // Simulates userStore.user() returning null
    userStore.user.mockReturnValue(null);

    const result = await guard.canActivate();

    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      'User not loaded within 2 seconds',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
