import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { SettingsPageComponent } from './settings-page.component';
import { LoadingPageStore } from '../../core/stores/loadingPage.store';
import { AuthService } from '../../core/services/auth.service';

describe('SettingsPageComponent', () => {
  let component: SettingsPageComponent;
  let fixture: ComponentFixture<SettingsPageComponent>;
  let loadingPageStore: LoadingPageStore;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    const loadingPageStoreMock = {
      setAuthLayoutLoadingPageVisible: jest.fn(),
    };
    const authServiceMock = {
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent, RouterTestingModule],
      providers: [
        { provide: LoadingPageStore, useValue: loadingPageStoreMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    loadingPageStore = TestBed.inject(LoadingPageStore);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log out when button is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');
    const button = fixture.debugElement.query(By.css('app-button'));

    button.triggerEventHandler('click');

    expect(loadingPageStore.setAuthLayoutLoadingPageVisible).toHaveBeenCalledWith(false);
    expect(authService.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
