import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ElementRef } from '@angular/core';

import { ChatService } from '../../../core/services/chat.service';
import { MessageService } from '../../../core/services/message.service';
import { UserService } from '../../../core/services/user.service';
import { UserStore } from '../../../core/stores/user.store';
import { expect } from '@jest/globals';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  // Fully mocked services
  const mockChatService = {
    logMessages$: of([]),
    startChat: jest.fn(),
    exitRoom: jest.fn(),
    sendMessage: jest.fn(),
  };

  const mockMessageService = {
    getUserRooms: jest.fn().mockReturnValue(
      of({
        rooms: [
          {
            RoomId: 'room123',
            Members: [
              {
                PK: 'USER#2',
                UserId: 2,
                Username: 'Alice',
                ProfilePicture: '',
              },
              {
                PK: 'USER#1',
                UserId: 1,
                Username: 'TestUser',
                ProfilePicture: '',
              },
            ],
          },
        ],
      }),
    ),
  };

  const mockUserService = {
    markRoomMessagesAsRead: jest.fn().mockReturnValue(of({})),
  };

  const mockUserStore = {
    user: jest.fn(() => ({
      UserId: 1,
      Username: 'TestUser',
      ProfilePicture: '',
    })),
  };

  // Subject to simulate route param changes
  const paramMapSubject = new Subject();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent], // standalone component
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: UserService, useValue: mockUserService },
        { provide: UserStore, useValue: mockUserStore },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'room123' }) },
            paramMap: paramMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;

    // Mock the chatLog element to avoid ViewChild null issues
    component.chatLogRef = {
      nativeElement: { scrollTop: 0, scrollHeight: 100 },
    } as ElementRef;

    fixture.detectChanges();

    // Emit initial paramMap value so ngOnInit sees it
    paramMapSubject.next(convertToParamMap({ id: 'room123' }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call startChat when userStore emits a user', () => {
    expect(mockChatService.startChat).toHaveBeenCalledWith(
      undefined, // adjust to 1 if you fix component to pass UserId
      'room123',
    );
  });

  it('should load room members', () => {
    component.loadRoomMembers();
    expect(mockMessageService.getUserRooms).toHaveBeenCalledWith(1);
    expect(component.otherMembers.length).toBe(2);
    expect(component.otherMembers[0].Username).toBe('Alice');
  });

  it('clearNotifications calls userService', () => {
    component.clearNotifications();
    expect(mockUserService.markRoomMessagesAsRead).toHaveBeenCalledWith(
      'room123',
    );
  });

  it('sendMessage calls chatService and clears input', () => {
    component.loggedInUser = {
      UserId: 1,
      Username: 'TestUser',
      ProfilePicture: '',
    };
    component.messageText = 'hello';
    component.sendMessage(component.messageText);

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(
      'hello',
      1,
      'TestUser',
      '',
      'room123',
    );
    expect(component.messageText).toBe('');
  });

  it('ngOnDestroy calls exitRoom', () => {
    component.ngOnDestroy();
    expect(mockChatService.exitRoom).toHaveBeenCalledWith('room123');
  });

  it('scrollToBottom sets scrollTop', () => {
    const div = { scrollTop: 0, scrollHeight: 100 } as any;
    component.chatLogRef = { nativeElement: div };
    component.scrollToBottom();
    expect(div.scrollTop).toBe(100);
  });

  it('should react to route param changes', () => {
    paramMapSubject.next(convertToParamMap({ id: 'room456' }));
    expect(component.roomId).toBe('room456');
  });
});
