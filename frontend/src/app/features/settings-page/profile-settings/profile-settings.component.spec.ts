import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings.component';
import { ProfileService } from '../../../core/services/pfp.service';
import { UserService } from '../../../core/services/user.service';
import { UserStore } from '../../../core/stores/user.store';
import { of, throwError } from 'rxjs';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;
  let mockProfileService: any;
  let mockUserService: any;
  let mockUserStore: any;

  const mockUser = {
    UserId: 'user123',
    Username: 'testuser',
    Bio: 'My bio',
    Playstyle: 'Aggressive',
    Platform: ['PC'],
    Languages: ['en', 'es'],
  };

  beforeEach(async () => {
    mockProfileService = {
      uploadProfilePicture: jest
        .fn()
        .mockReturnValue(of({ url: 'http://image.url' })),
    };

    mockUserService = {
      updateUser: jest.fn().mockReturnValue(of({})),
      getUserByUsername: jest.fn().mockReturnValue(of({ users: [] })),
    };

    mockUserStore = {
      getUser: jest.fn().mockReturnValue(mockUser),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: mockProfileService },
        { provide: UserService, useValue: mockUserService },
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: jest.fn() },
    });

    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize user data on ngOnInit', () => {
    component.ngOnInit();
    expect(component.user).toEqual(mockUser);
    expect(component.username).toBe('testuser');
    expect(component.bio).toBe('My bio');
    expect(component.playstyle).toBe('Aggressive');
    expect(component.selectedPlatforms).toEqual(['PC']);
    expect(component.selectedLanguages).toEqual(['en', 'es']);
  });

  it('should handle file selection', fakeAsync(() => {
    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    const event: any = { target: { files: [file] } };
    const readerSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
    component.onFileSelected(event);
    tick();
    expect(component.selectedFile).toBe(file);
    expect(component.selectedFileName).toBe('photo.png');
    expect(readerSpy).toHaveBeenCalledWith(file);
  }));

  it('should call profileService.uploadProfilePicture on upload', () => {
    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    component.selectedFile = file;

    const reloadSpy = jest.spyOn(window.location, 'reload');

    component.upload();

    expect(mockProfileService.uploadProfilePicture).toHaveBeenCalledWith(file);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should validate username correctly', () => {
    component.username = 'valid_user';
    component.onUsernameInput();
    expect(component.validUsername).toBe(true);
    expect(component.usernameTaken).toBe(false);

    component.username = 'x';
    component.onUsernameInput();
    expect(component.validUsername).toBe(false);
  });

  it('should toggle languages correctly', () => {
    component.selectedLanguages = ['en'];
    component.toggleLanguage('es');
    expect(component.selectedLanguages).toEqual(['en', 'es']);
    component.toggleLanguage('en');
    expect(component.selectedLanguages).toEqual(['es']);
  });

  it('should toggle platforms correctly', () => {
    component.selectedPlatforms = ['PC'];
    component.togglePlatform('Xbox');
    expect(component.selectedPlatforms).toEqual(['PC', 'Xbox']);
    component.togglePlatform('PC');
    expect(component.selectedPlatforms).toEqual(['Xbox']);
  });

  it('should set feedback messages and clear after timeout', fakeAsync(() => {
    component['setFeedback']('username', 'Test message');
    expect(component.feedbackMessages.username).toBe('Test message');
    tick(3500);
    expect(component.feedbackMessages.username).toBe('');
  }));

  it('should handle saveUsername', () => {
    component.user = mockUser;
    component.username = 'newname';
    component.saveUsername();
    expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
      username: 'newname',
    });
  });

  it('should handle saveBio', () => {
    component.user = mockUser;
    component.bio = 'Updated bio';
    component.saveBio();
    expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
      bio: 'Updated bio',
    });
  });

  it('should handle saveLanguages', () => {
    component.user = mockUser;
    component.selectedLanguages = ['fr', 'de'];
    component.saveLanguages();
    expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
      languages: ['fr', 'de'],
    });
  });

  it('should handle savePlaystyleAndPlatform', () => {
    component.user = mockUser;
    component.playstyle = 'Defensive';
    component.selectedPlatforms = ['PC', 'Xbox'];
    component.savePlaystyleAndPlatform();
    expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
      playstyle: 'Defensive',
      platform: ['PC', 'Xbox'],
    });
  });

  it('should validate username and handle taken username', fakeAsync(() => {
    component.user = mockUser;
    component.username = 'takenUser';
    mockUserService.getUserByUsername = jest
      .fn()
      .mockReturnValue(of({ users: [{ UserId: 'other' }] }));
    component.validateUsername();
    tick();
    expect(component.usernameTaken).toBe(true);
    expect(component.feedbackMessages.username).toBe(
      'Username is already taken.'
    );
  }));

  it('should handle username validation error', fakeAsync(() => {
    component.user = mockUser;
    component.username = 'errorUser';
    mockUserService.getUserByUsername = jest
      .fn()
      .mockReturnValue(throwError({ status: 500 }));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    component.validateUsername();
    tick();
    expect(consoleSpy).toHaveBeenCalledWith('Username validation failed:', {
      status: 500,
    });
    consoleSpy.mockRestore();
  }));
});
