import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerCardComponent } from './player-card.component';
import { FriendService } from '../../../core/services/friend.service';
import { ChatService } from '../../../core/services/chat.service';
import { User } from '../../../core/interfaces/user.model';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PlayerCardComponent', () => {
  let component: PlayerCardComponent;
  let fixture: ComponentFixture<PlayerCardComponent>;
  let friendService: FriendService;
  let chatService: ChatService;

  const mockUser: User = {
    PK: 'USER#123',
    SK: 'PROFILE',
    UserId: 'user-123',
    Username: 'TestPlayer',
    Email: 'test@example.com',
    ProfilePicture: 'https://example.com/profile.jpg',
    Bio: 'Test bio description',
    Languages: ['en', 'fi'],
    PlayedGames: [
      { gameId: 'game1', gameName: 'CS2' },
      { gameId: 'game2', gameName: 'Valorant' },
    ],
    CreatedAt: 1704067200,
    AverageReputation: 100,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCardComponent],
      providers: [
        FriendService,
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerCardComponent);
    component = fixture.componentInstance;
    friendService = TestBed.inject(FriendService);
    chatService = TestBed.inject(ChatService);
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should accept user input', () => {
      component.user = mockUser;
      fixture.detectChanges();
      expect(component.user).toEqual(mockUser);
    });
  });

  describe('User Data Display', () => {
    beforeEach(() => {
      component.user = mockUser;
      fixture.detectChanges();
    });

    it('should display username', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const userName = compiled.querySelector('.user-name');
      expect(userName?.textContent?.trim()).toBe('TestPlayer');
    });

    it('should display profile picture with correct src', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('.card-img-top') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/profile.jpg');
      expect(img.alt).toBe('Profile picture');
    });

    it('should display bio text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const bio = compiled.querySelector('.bio-text');
      expect(bio?.textContent?.trim()).toBe('Test bio description');
    });

    it('should display languages', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const languages = compiled.querySelector('.languages');
      expect(languages?.textContent?.trim()).toContain('en');
    });

    it('should not display languages paragraph when Languages is undefined', () => {
      component.user = { ...mockUser, Languages: undefined };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const languages = compiled.querySelector('.languages');
      expect(languages).toBeNull();
    });
  });

  describe('onProfile() Method', () => {
    it('should log correct message when onProfile is called', () => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'log');

      component.onProfile();

      expect(consoleSpy).toHaveBeenCalledWith('Opening profile of TestPlayer');
      consoleSpy.mockRestore();
    });

    it('should call onProfile when profile image is clicked', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const onProfileSpy = jest.spyOn(component, 'onProfile');

      const compiled = fixture.nativeElement as HTMLElement;
      const imgWrapper = compiled.querySelector(
        '.card-img-wrapper'
      ) as HTMLElement;
      imgWrapper.click();

      expect(onProfileSpy).toHaveBeenCalled();
    });

    it('should have correct accessibility attributes on profile image wrapper', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const imgWrapper = compiled.querySelector(
        '.card-img-wrapper'
      ) as HTMLElement;

      expect(imgWrapper.getAttribute('role')).toBe('button');
      expect(imgWrapper.getAttribute('tabindex')).toBe('0');
      expect(imgWrapper.getAttribute('aria-label')).toBe(
        'Open profile of TestPlayer'
      );
      expect(imgWrapper.getAttribute('data-tooltip')).toBe(
        'View player profile'
      );
    });
  });

  describe('SendMsg() Method', () => {
    it('should call chatService.startChat with correct userId', () => {
      component.user = mockUser;
      const startChatSpy = jest.spyOn(chatService, 'startChat');

      component.SendMsg('user-123');

      expect(startChatSpy).toHaveBeenCalledWith(['user-123']);
    });

    it('should call SendMsg when Send Message button is clicked', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const sendMsgSpy = jest.spyOn(component, 'SendMsg');

      const compiled = fixture.nativeElement as HTMLElement;
      const sendMsgBtn = compiled.querySelector(
        '.btn-primary'
      ) as HTMLButtonElement;
      sendMsgBtn.click();

      expect(sendMsgSpy).toHaveBeenCalledWith('user-123');
    });

    it('should display Send Message button with correct text and icon', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const sendMsgBtn = compiled.querySelector('.btn-primary') as HTMLElement;
      const icon = sendMsgBtn.querySelector('.btn-icon') as HTMLImageElement;
      const span = sendMsgBtn.querySelector('span') as HTMLElement;

      expect(sendMsgBtn).toBeTruthy();
      expect(icon.src).toContain('/assets/svg/Messages/NoMessage.svg');
      expect(span.textContent).toBe('Send Message');
    });
  });

  describe('onAddFriend() Method - Success Cases', () => {
    beforeEach(() => {
      component.user = mockUser;
    });

    it('should call friendService.sendFriendRequest with correct userId', () => {
      const sendFriendRequestSpy = jest
        .spyOn(friendService, 'sendFriendRequest')
        .mockReturnValue(of({ success: true, message: 'Friend request sent' }));

      component.onAddFriend();

      expect(sendFriendRequestSpy).toHaveBeenCalledWith('user-123');
    });

    it('should log success message on successful friend request', () => {
      jest
        .spyOn(friendService, 'sendFriendRequest')
        .mockReturnValue(of({ success: true, message: 'Friend request sent' }));
      const consoleSpy = jest.spyOn(console, 'log');
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      component.onAddFriend();

      expect(consoleSpy).toHaveBeenCalledWith('Friend request sent:', {
        success: true,
        message: 'Friend request sent',
      });
      expect(alertSpy).toHaveBeenCalledWith(
        'Friend request sent to TestPlayer'
      );

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should call onAddFriend when Add Friend button is clicked', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const onAddFriendSpy = jest
        .spyOn(component, 'onAddFriend')
        .mockImplementation();

      const compiled = fixture.nativeElement as HTMLElement;
      const addFriendBtn = compiled.querySelector(
        '.btn-success'
      ) as HTMLButtonElement;
      addFriendBtn.click();

      expect(onAddFriendSpy).toHaveBeenCalled();
    });

    it('should display Add Friend button with correct text and icon', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const addFriendBtn = compiled.querySelector(
        '.btn-success'
      ) as HTMLElement;
      const icon = addFriendBtn.querySelector('.btn-icon') as HTMLImageElement;
      const span = addFriendBtn.querySelector('span') as HTMLElement;

      expect(addFriendBtn).toBeTruthy();
      expect(icon.src).toContain('/assets/svg/Plus_icon.svg');
      expect(span.textContent).toBe('Add Friend');
    });
  });

  describe('onAddFriend() Method - Error Cases', () => {
    it('should log error and show alert when friend request fails', () => {
      component.user = mockUser;
      const error = { message: 'Network error' };
      jest
        .spyOn(friendService, 'sendFriendRequest')
        .mockReturnValue(throwError(() => error));
      const consoleErrorSpy = jest.spyOn(console, 'error');
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      component.onAddFriend();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending friend request',
        error
      );
      expect(alertSpy).toHaveBeenCalledWith('Failed to send friend request');

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should return early when user is undefined', () => {
      component.user = undefined as any;
      const sendFriendRequestSpy = jest.spyOn(
        friendService,
        'sendFriendRequest'
      );

      component.onAddFriend();

      expect(sendFriendRequestSpy).not.toHaveBeenCalled();
    });

    it('should return early when UserId is undefined', () => {
      component.user = { ...mockUser, UserId: undefined } as any;
      const sendFriendRequestSpy = jest.spyOn(
        friendService,
        'sendFriendRequest'
      );

      component.onAddFriend();

      expect(sendFriendRequestSpy).not.toHaveBeenCalled();
    });

    it('should return early when UserId is empty string', () => {
      component.user = { ...mockUser, UserId: '' };
      const sendFriendRequestSpy = jest.spyOn(
        friendService,
        'sendFriendRequest'
      );

      component.onAddFriend();

      expect(sendFriendRequestSpy).not.toHaveBeenCalled();
    });
  });

  describe('UI Rendering and Structure', () => {
    it('should render card with correct structure', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.card')).toBeTruthy();
      expect(compiled.querySelector('.card-body')).toBeTruthy();
      expect(compiled.querySelector('.card-left')).toBeTruthy();
      expect(compiled.querySelector('.card-right')).toBeTruthy();
    });

    it('should render card-left with image wrapper and username', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cardLeft = compiled.querySelector('.card-left') as HTMLElement;

      expect(cardLeft.querySelector('.card-img-wrapper')).toBeTruthy();
      expect(cardLeft.querySelector('.user-name')).toBeTruthy();
    });

    it('should render card-right with bio, languages, and actions', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const cardRight = compiled.querySelector('.card-right') as HTMLElement;

      expect(cardRight.querySelector('.bio-text')).toBeTruthy();
      expect(cardRight.querySelector('.divider')).toBeTruthy();
      expect(cardRight.querySelector('.languages')).toBeTruthy();
      expect(cardRight.querySelector('.card-actions')).toBeTruthy();
    });

    it('should render both action buttons', () => {
      component.user = mockUser;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const actions = compiled.querySelector('.card-actions') as HTMLElement;
      const buttons = actions.querySelectorAll('button');

      expect(buttons.length).toBe(2);
      expect(buttons[0].classList.contains('btn-primary')).toBe(true);
      expect(buttons[1].classList.contains('btn-success')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with empty Bio', () => {
      component.user = { ...mockUser, Bio: '' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const bio = compiled.querySelector('.bio-text');
      expect(bio?.textContent?.trim()).toBe('');
    });

    it('should handle user with very long Username', () => {
      const longUsername = 'A'.repeat(100);
      component.user = { ...mockUser, Username: longUsername };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const userName = compiled.querySelector('.user-name');
      expect(userName?.textContent?.trim()).toBe(longUsername);
    });

    it('should handle user with special characters in Username', () => {
      component.user = { ...mockUser, Username: 'Test_Player-123!' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const userName = compiled.querySelector('.user-name');
      expect(userName?.textContent?.trim()).toBe('Test_Player-123!');
    });

    it('should handle missing ProfilePicture gracefully', () => {
      component.user = { ...mockUser, ProfilePicture: '' };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('.card-img-top') as HTMLImageElement;
      expect(img.getAttribute('src')).toBe('');
    });

    it('should handle user with empty Languages array', () => {
      component.user = { ...mockUser, Languages: [] };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const languages = compiled.querySelector('.languages');
      expect(languages).toBeTruthy();
      expect(languages?.textContent?.trim()).toBe('');
    });

    it('should handle user with undefined Languages (no element rendered)', () => {
      component.user = { ...mockUser, Languages: undefined };
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const languages = compiled.querySelector('.languages');
      expect(languages).toBeNull();
    });

    it('should handle SendMsg with null userId', () => {
      component.user = mockUser;
      const startChatSpy = jest.spyOn(chatService, 'startChat');

      component.SendMsg(null);

      expect(startChatSpy).toHaveBeenCalledWith([null]);
    });

    it('should handle onProfile with user having undefined Username', () => {
      component.user = { ...mockUser, Username: undefined } as any;
      const consoleSpy = jest.spyOn(console, 'log');

      component.onProfile();

      expect(consoleSpy).toHaveBeenCalledWith('Opening profile of undefined');
      consoleSpy.mockRestore();
    });
  });
});
