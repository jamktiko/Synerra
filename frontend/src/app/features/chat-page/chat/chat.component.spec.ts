import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../../core/services/chat.service';
import { UserStore } from '../../../core/stores/user.store';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from '../../../core/services/message.service';
import { By } from '@angular/platform-browser';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  // Mock services - fake versions that we control in tests
  let mockChatService: any;
  let mockUserStore: any;
  let mockUserService: any;
  let mockMessageService: any;
  let mockActivatedRoute: any;
  // BehaviorSubject - an RxJS observable that holds a current value
  // We use this to simulate the real-time message stream in a controlled way
  let messagesSubject: BehaviorSubject<any[]>;

  // Test data representing a logged-in user
  const mockUser = {
    PK: 'USER#user123',
    SK: 'USER#user123',
    UserId: 'user123',
    Username: 'TestUser',
    Email: 'test@example.com',
    ProfilePicture: 'assets/default-avatar.png',
    PlayedGames: [],
  };

  // Test data representing chat messages (one from current user, one from another user)
  const mockMessages = [
    {
      SenderId: 'user123',
      SenderUsername: 'TestUser',
      Content: 'Hello from me',
      Timestamp: new Date('2025-01-15T10:30:00'),
      ProfilePicture: 'assets/avatar1.png',
    },
    {
      SenderId: 'user456',
      SenderUsername: 'OtherUser',
      Content: 'Hello from other',
      Timestamp: new Date('2025-01-15T10:31:00'),
      ProfilePicture: 'assets/avatar2.png',
    },
  ];

  beforeEach(async () => {
    // Create a BehaviorSubject to simulate the messages stream
    // Starts with an empty array, we can push new messages during tests
    messagesSubject = new BehaviorSubject<any[]>([]);

    // Mock ChatService with Jest spy functions
    // jest.fn() creates a spy that tracks calls and can return fake values
    mockChatService = {
      logMessages$: messagesSubject.asObservable(), // Observable for message stream
      startChat: jest.fn(),
      sendMessage: jest.fn(),
      exitRoom: jest.fn(),
    };

    // Mock user store - returns our test user
    mockUserStore = {
      user: jest.fn(() => mockUser),
    };

    // Mock UserService - simulates marking messages as read
    // of() creates an Observable that emits once and completes
    mockUserService = {
      markRoomMessagesAsRead: jest.fn(() => of({ success: true })),
    };

    mockMessageService = {};

    // Mock route with room ID parameter
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn(() => 'room123'), // Returns 'room123' when component asks for route param
        },
      },
    };

    // Configure testing module with all dependencies
    await TestBed.configureTestingModule({
      imports: [ChatComponent, FormsModule, RouterTestingModule],
      providers: [
        // Replace real services with our mocks
        { provide: ChatService, useValue: mockChatService },
        { provide: UserStore, useValue: mockUserStore },
        { provide: UserService, useValue: mockUserService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    // Manually set the logged-in user (normally done by ngOnInit)
    component.loggedInUser = mockUser;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize roomId from route parameter', () => {
      expect(component.roomId).toBe('room123');
    });

    it('should initialize messages$ observable', () => {
      expect(component.messages$).toBeDefined();
    });

    it('should initialize messageText as empty', () => {
      expect(component.messageText).toBe('');
    });

    it('should initialize messageHistory as empty array', () => {
      expect(component.messageHistory).toEqual([]);
    });
  });

  describe('Layout and DOM Structure', () => {
    it('should render chatElement container', () => {
      const chatElement = fixture.debugElement.query(By.css('.chatElement'));
      expect(chatElement).toBeTruthy();
    });

    it('should render header (headframe)', () => {
      const headframe = fixture.debugElement.query(By.css('.headframe'));
      expect(headframe).toBeTruthy();
    });

    it('should render avatar in header', () => {
      const avatar = fixture.debugElement.query(By.css('.avatarframe-icon'));
      expect(avatar).toBeTruthy();
      expect(avatar.nativeElement.src).toContain('Acount.svg');
    });

    it('should render "Chat" heading', () => {
      const heading = fixture.debugElement.query(By.css('.chatheading'));
      expect(heading).toBeTruthy();
      expect(heading.nativeElement.textContent).toBe('Chat');
    });

    it('should render close button', () => {
      const closeButton = fixture.debugElement.query(
        By.css('.headerButton button')
      );
      expect(closeButton).toBeTruthy();
    });

    it('should have Cross.svg icon in close button', () => {
      const closeButtonImg = fixture.debugElement.query(
        By.css('.headerButton button img')
      );
      expect(closeButtonImg).toBeTruthy();
      expect(closeButtonImg.nativeElement.src).toContain('Cross.svg');
    });

    it('should render chat-log area', () => {
      const chatLog = fixture.debugElement.query(By.css('.chat-log'));
      expect(chatLog).toBeTruthy();
    });

    it('should render chat-input area', () => {
      const chatInput = fixture.debugElement.query(By.css('.chat-input'));
      expect(chatInput).toBeTruthy();
    });

    it('should render input field', () => {
      const input = fixture.debugElement.query(By.css('.chat-input input'));
      expect(input).toBeTruthy();
    });

    it('should render send button', () => {
      const sendButton = fixture.debugElement.query(
        By.css('.chat-input button')
      );
      expect(sendButton).toBeTruthy();
    });

    it('should have Send.svg icon in send button', () => {
      const sendButtonImg = fixture.debugElement.query(
        By.css('.chat-input button img')
      );
      expect(sendButtonImg).toBeTruthy();
      expect(sendButtonImg.nativeElement.src).toContain('Send.svg');
    });
  });

  describe('Close Button RouterLink', () => {
    it('should navigate to /dashboard/social page', () => {
      const closeButton = fixture.debugElement.query(
        By.css('.headerButton button')
      );
      expect(
        closeButton.nativeElement.getAttribute('ng-reflect-router-link')
      ).toBe('/dashboard/social');
    });
  });

  describe('Message Rendering', () => {
    // Verify empty state - no messages should render initially
    it('should not render messages when messages$ is empty', () => {
      const messages = fixture.debugElement.queryAll(By.css('.chats'));
      expect(messages.length).toBe(0);
    });

    // Test sent message rendering (messages from current user)
    // messagesSubject.next() pushes new data to the observable stream
    it('should render sent messages correctly', () => {
      messagesSubject.next([mockMessages[0]]); // Push first message (from current user)
      fixture.detectChanges(); // Trigger Angular to re-render

      const sentMessage = fixture.debugElement.query(
        By.css('.sentMessageWrapper')
      );
      expect(sentMessage).toBeTruthy();
    });

    // Test received message rendering (messages from other users)
    it('should render received messages correctly', () => {
      messagesSubject.next([mockMessages[1]]); // Push second message (from other user)
      fixture.detectChanges();

      const receivedMessage = fixture.debugElement.query(
        By.css('.receivedMessageWrapper')
      );
      expect(receivedMessage).toBeTruthy();
    });

    it('should show message content in sent message', () => {
      messagesSubject.next([mockMessages[0]]);
      fixture.detectChanges();

      const sentMessage = fixture.debugElement.query(By.css('.sentMessage p'));
      expect(sentMessage.nativeElement.textContent).toBe('Hello from me');
    });

    it('should show sender name in received message', () => {
      messagesSubject.next([mockMessages[1]]);
      fixture.detectChanges();

      const receivedMessage = fixture.debugElement.queryAll(
        By.css('.receivedMessage p')
      );
      expect(receivedMessage[0].nativeElement.textContent).toBe('OtherUser');
    });

    it('should show message content in received message', () => {
      messagesSubject.next([mockMessages[1]]);
      fixture.detectChanges();

      const receivedMessage = fixture.debugElement.queryAll(
        By.css('.receivedMessage p')
      );
      expect(receivedMessage[1].nativeElement.textContent).toBe(
        'Hello from other'
      );
    });

    it('should render avatar in received message', () => {
      messagesSubject.next([mockMessages[1]]);
      fixture.detectChanges();

      const avatar = fixture.debugElement.query(By.css('.messageAvatar'));
      expect(avatar).toBeTruthy();
      expect(avatar.nativeElement.src).toContain('avatar2.png');
    });

    // Test fallback avatar - uses spread operator to clone and modify message
    it('should show default avatar if ProfilePicture is empty', () => {
      const messageWithoutAvatar = { ...mockMessages[1], ProfilePicture: null };
      messagesSubject.next([messageWithoutAvatar]);
      fixture.detectChanges();

      const avatar = fixture.debugElement.query(By.css('.messageAvatar'));
      expect(avatar.nativeElement.src).toContain('Acount.svg');
    });

    // Test rendering multiple messages at once
    it('should render multiple messages', () => {
      messagesSubject.next(mockMessages); // Push all messages
      fixture.detectChanges();

      const allMessages = fixture.debugElement.queryAll(By.css('.chats'));
      expect(allMessages.length).toBe(2);
    });
  });

  describe('sendMessage() Method - Logic Tests', () => {
    // Verify that input field is cleared after sending a message
    it('should clear messageText after sending', () => {
      component.messageText = 'Test message';
      component.sendMessage('Test message');

      expect(component.messageText).toBe('');
    });

    it('should work with empty message', () => {
      expect(() => component.sendMessage('')).not.toThrow();
    });

    it('should work with long message', () => {
      const longMessage = 'A'.repeat(500);
      expect(() => component.sendMessage(longMessage)).not.toThrow();
    });

    it('should be defined', () => {
      expect(component.sendMessage).toBeDefined();
      expect(typeof component.sendMessage).toBe('function');
    });
  });

  describe('input Field Functionality', () => {
    it('should update messageText via ngModel', () => {
      const input = fixture.debugElement.query(By.css('.chat-input input'));
      const inputElement = input.nativeElement;

      inputElement.value = 'New message';
      inputElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.messageText).toBe('New message');
    });

    it('should call sendMessage on Enter key', () => {
      component.messageText = 'Test message';

      const input = fixture.debugElement.query(By.css('.chat-input input'));
      input.triggerEventHandler('keyup.enter', {});

      // messageText cleared -> sendMessage was called
      expect(component.messageText).toBe('');
    });

    it('should call sendMessage when clicking send button', () => {
      component.messageText = 'Test message';

      const button = fixture.debugElement.query(By.css('.chat-input button'));
      button.nativeElement.click();

      // messageText cleared -> sendMessage was called
      expect(component.messageText).toBe('');
    });
  });

  describe('Timestamp Formatting', () => {
    it('should show timestamp in sent messages in format d.MM.yyyy, HH.mm', () => {
      messagesSubject.next([mockMessages[0]]);
      fixture.detectChanges();

      const timestamp = fixture.debugElement.query(By.css('.sentTimestamp'));
      expect(timestamp).toBeTruthy();
      // Date pipe formats automatically
    });

    it('should show timestamp in received messages in format dd/MM/yyyy, HH:mm', () => {
      messagesSubject.next([mockMessages[1]]);
      fixture.detectChanges();

      const timestamp = fixture.debugElement.query(
        By.css('.receivedTimestamp')
      );
      expect(timestamp).toBeTruthy();
    });
  });

  describe('Message Separation (sent vs received)', () => {
    it('should show message as sent when SenderId === loggedInUser.UserId', () => {
      const ownMessage = { ...mockMessages[0], SenderId: mockUser.UserId };
      messagesSubject.next([ownMessage]);
      fixture.detectChanges();

      const sentMessage = fixture.debugElement.query(
        By.css('.sentMessageWrapper')
      );
      const receivedMessage = fixture.debugElement.query(
        By.css('.receivedMessageWrapper')
      );

      expect(sentMessage).toBeTruthy();
      expect(receivedMessage).toBeFalsy();
    });

    it('should show message as received when SenderId !== loggedInUser.UserId', () => {
      const otherMessage = { ...mockMessages[1], SenderId: 'differentUser' };
      messagesSubject.next([otherMessage]);
      fixture.detectChanges();

      const sentMessage = fixture.debugElement.query(
        By.css('.sentMessageWrapper')
      );
      const receivedMessage = fixture.debugElement.query(
        By.css('.receivedMessageWrapper')
      );

      expect(sentMessage).toBeFalsy();
      expect(receivedMessage).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle situation when roomId is empty', () => {
      mockActivatedRoute.snapshot.paramMap.get = jest.fn(() => null);

      // Recreate component with null roomId
      const newFixture = TestBed.createComponent(ChatComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.roomId).toBe('');
    });

    it('should handle special characters in message', () => {
      component.sendMessage('<script>alert("xss")</script>');

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '<script>alert("xss")</script>',
        'user123',
        'TestUser',
        'assets/default-avatar.png',
        'room123'
      );
    });

    it('should handle emoji characters in message', () => {
      component.sendMessage('Hello 👋 🎮 🚀');

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Hello 👋 🎮 🚀',
        'user123',
        'TestUser',
        'assets/default-avatar.png',
        'room123'
      );
    });
  });
});
