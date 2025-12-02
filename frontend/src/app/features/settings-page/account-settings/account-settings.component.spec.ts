import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountSettingsComponent } from './account-settings.component';
import { UserService } from '../../../core/services/user.service';
import { of } from 'rxjs';
import { LoadingPageStore } from '../../../core/stores/loadingPage.store';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';
import { provideRouter } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('AccountSettingsComponent', () => {
  let component: AccountSettingsComponent;
  let fixture: ComponentFixture<AccountSettingsComponent>;
  let loadingPageStore: LoadingPageStore;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    const userServiceStub = {
      users$: of([]),
    };
    const loadingPageStoreStub = {
      setAuthLayoutLoadingPageVisible: jest.fn(),
    };
    const authServiceStub = {
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AccountSettingsComponent, RouterTestingModule],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceStub },
        { provide: LoadingPageStore, useValue: loadingPageStoreStub },
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSettingsComponent);
    component = fixture.componentInstance;
    loadingPageStore = TestBed.inject(LoadingPageStore);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should flag mismatch when confirmation differs', () => {
    component.passwordForm.setValue({
      currentPassword: 'old',
      newPassword: 'new-pass',
      confirmPassword: 'other',
    });
    expect(component.passwordForm.hasError('mismatch')).toBeTruthy();
  });

  it('should toggle linked account state', () => {
    expect(component.isLinked('steam')).toBeFalsy();
    component.toggleLink('steam');
    expect(component.isLinked('steam')).toBeTruthy();
    component.toggleLink('steam');
    expect(component.isLinked('steam')).toBeFalsy();
  });

  it('should logout through services', async () => {
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.logOut();

    expect(
      loadingPageStore.setAuthLayoutLoadingPageVisible,
    ).toHaveBeenCalledWith(false);
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
