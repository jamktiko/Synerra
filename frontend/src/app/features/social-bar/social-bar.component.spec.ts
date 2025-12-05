import { SocialBarComponent } from './social-bar.component';
import { FriendService } from '../../core/services/friend.service';
import { ChatService } from '../../core/services/chat.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../core/interfaces/user.model';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { expect } from '@jest/globals';

describe('SocialBarComponent', () => {
  let component: SocialBarComponent;
  let mockFriendService: jest.Mocked<Partial<FriendService>>;
  let mockChatService: jest.Mocked<Partial<ChatService>>;
  let mockRouter: jest.Mocked<Partial<Router>>;
  let mockChangeDetectorRef: jest.Mocked<Partial<ChangeDetectorRef>>;
  let mockElementRef: ElementRef;

  const mockUsers: User[] = [
    {
      UserId: '1',
      Username: 'TestUser1',
      Email: 'test1@example.com',
      Status: 'online',
      ProfilePicture: 'test1.jpg',
    },
    {
      UserId: '2',
      Username: 'TestUser2',
      Email: 'test2@example.com',
      Status: 'offline',
      ProfilePicture: 'test2.jpg',
    },
  ];

  beforeEach(() => {
    mockFriendService = {
      friends$: of(mockUsers),
      getFriends: jest.fn().mockReturnValue(of(mockUsers)),
    };

    mockChatService = {
      startChat: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
    };

    // 🔥 Tärkeä korjaus: oikea DOM-elementti mockiin
    mockElementRef = new ElementRef(document.createElement('div'));

    mockChangeDetectorRef = {
      detectChanges: jest.fn(),
      markForCheck: jest.fn(),
    };

    component = new SocialBarComponent(
      mockFriendService as FriendService,
      mockChatService as ChatService,
      mockChangeDetectorRef as ChangeDetectorRef,
      mockRouter as Router,
      mockElementRef as ElementRef
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load friends on init', (done) => {
    component.users$.subscribe((users) => {
      expect(users).toHaveLength(2);
      expect(users[0].Username).toBe('TestUser1');
      done();
    });
  });

  it('should sort online users first', (done) => {
    component.users$.subscribe((users) => {
      expect(users[0].Status).toBe('online');
      expect(users[1].Status).toBe('offline');
      done();
    });
  });

  it('should filter online users correctly', (done) => {
    component.onlineUsers$.subscribe((users) => {
      expect(users).toHaveLength(1);
      expect(users[0].Status).toBe('online');
      done();
    });
  });

  it('should toggle dropdown on user click', () => {
    const event = new MouseEvent('click');
    jest.spyOn(event, 'stopPropagation');

    component.toggleDropdown('1', event);
    expect(component.openDropdownUserId).toBe('1');

    component.toggleDropdown('1', event);
    expect(component.openDropdownUserId).toBeNull();
  });

  it('should open chat when openChat is called', () => {
    component.openChat('1');
    expect(mockChatService.startChat).toHaveBeenCalledWith(['1']);
    expect(component.openDropdownUserId).toBeNull();
  });

  it('should navigate to profile when openProfile is called', () => {
    component.openProfile('1');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['dashboard/profile/1']);
    expect(component.openDropdownUserId).toBeNull();
  });

  it('should toggle notifications state', () => {
    expect(component.notificationsOpen).toBe(false);

    component.onNotificationsToggle(true);
    expect(component.notificationsOpen).toBe(true);

    component.onNotificationsToggle(false);
    expect(component.notificationsOpen).toBe(false);
  });

  it('should close dropdown when clicking outside', () => {
    component.openDropdownUserId = '1';

    const outside = document.createElement('span');
    const event = { target: outside } as unknown as MouseEvent;

    component.onDocumentClick(event);
    expect(component.openDropdownUserId).toBeNull();
  });

  it('should not close dropdown when clicking inside social-bar', () => {
    component.openDropdownUserId = '1';

    // Tee sisäinen elementti mockElementRef.root:iin
    const root = mockElementRef.nativeElement as HTMLElement;
    const inside = document.createElement('span');
    root.appendChild(inside);

    const event = { target: inside } as unknown as MouseEvent;

    component.onDocumentClick(event);
    expect(component.openDropdownUserId).toBe('1');
  });
});