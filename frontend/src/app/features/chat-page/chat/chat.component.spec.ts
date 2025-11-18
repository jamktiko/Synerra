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
  let mockChatService: any;
  let mockUserStore: any;
  let mockUserService: any;
  let mockMessageService: any;
  let mockActivatedRoute: any;

  let messagesSubject: BehaviorSubject<any[]>;

  const mockUser = {
    UserId: 'user123',
    Username: 'TestUser',
    ProfilePicture: 'assets/default-avatar.png',
  };

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
    messagesSubject = new BehaviorSubject<any[]>([]);

    mockChatService = {
      logMessages$: messagesSubject.asObservable(),
      startChat: jest.fn(),
      sendMessage: jest.fn(),
      exitRoom: jest.fn(),
    };

    mockUserStore = {
      user: jest.fn(() => mockUser),
    };

    mockUserService = {
      markRoomMessagesAsRead: jest.fn(() => of({ success: true })),
    };

    mockMessageService = {
      getUserRooms: jest.fn(() => of({ rooms: [] })),
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn(() => 'room123'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: UserStore, useValue: mockUserStore },
        { provide: UserService, useValue: mockUserService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;

    component.loggedInUser = mockUser;
    fixture.detectChanges();
  });

  // ------------------------------------
  // Component Initialization
  // ------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize roomId from route', () => {
    expect(component.roomId).toBe('room123');
  });

  // ------------------------------------
  // DOM Tests
  // ------------------------------------
  it('should render chatElement container', () => {
    expect(fixture.debugElement.query(By.css('.chatElement'))).toBeTruthy();
  });

  it('should render chat partner avatar', () => {
    const avatar = fixture.debugElement.query(By.css('.avatarframe-icon'));
    expect(avatar).toBeTruthy();
  });

  it('should render chat heading', () => {
    const heading = fixture.debugElement.query(By.css('.chatheading'));
    expect(heading).toBeTruthy();
  });

  it('should render close button with Cross.svg', () => {
    const img = fixture.debugElement.query(By.css('.headerButton img'));
    expect(img.nativeElement.src).toContain('Cross.svg');
  });

  it('should render chat-log area', () => {
    expect(fixture.debugElement.query(By.css('.chat-log'))).toBeTruthy();
  });

  it('should render input field', () => {
    expect(
      fixture.debugElement.query(By.css('.chat-input input')),
    ).toBeTruthy();
  });

  it('should render send button', () => {
    expect(
      fixture.debugElement.query(By.css('.chat-input button')),
    ).toBeTruthy();
  });

  // ------------------------------------
  // Message Rendering
  // ------------------------------------
  it('should show sent message when SenderId = logged in user', () => {
    messagesSubject.next([mockMessages[0]]);
    fixture.detectChanges();

    const sent = fixture.debugElement.query(By.css('.sentMessageWrapper'));
    expect(sent).toBeTruthy();
  });

  it('should show received message when SenderId != logged in user', () => {
    messagesSubject.next([mockMessages[1]]);
    fixture.detectChanges();

    const received = fixture.debugElement.query(
      By.css('.receivedMessageWrapper'),
    );
    expect(received).toBeTruthy();
  });

  it('should show message content in sent message', () => {
    messagesSubject.next([mockMessages[0]]);
    fixture.detectChanges();

    const p = fixture.debugElement.query(By.css('.sentMessage p'));
    expect(p.nativeElement.textContent).toBe('Hello from me');
  });

  it('should show sender name in received message', () => {
    messagesSubject.next([mockMessages[1]]);
    fixture.detectChanges();

    const name = fixture.debugElement.query(
      By.css('.receivedMessage p:first-child'),
    );
    expect(name.nativeElement.textContent).toBe('OtherUser');
  });

  it('should show content in received message', () => {
    messagesSubject.next([mockMessages[1]]);
    fixture.detectChanges();

    const content = fixture.debugElement.queryAll(
      By.css('.receivedMessage p'),
    )[1];

    expect(content.nativeElement.textContent).toBe('Hello from other');
  });

  it('should render avatar in received message', () => {
    messagesSubject.next([mockMessages[1]]);
    fixture.detectChanges();

    const avatar = fixture.debugElement.query(By.css('.messageAvatar'));
    expect(avatar.nativeElement.src).toContain('avatar2.png');
  });

  it('should show default avatar if none provided', () => {
    const missing = { ...mockMessages[1], ProfilePicture: null };

    messagesSubject.next([missing]);
    fixture.detectChanges();

    const avatar = fixture.debugElement.query(By.css('.messageAvatar'));
    expect(avatar.nativeElement.src).toContain(
      'assets/images/profilePicPlaceHolder.jpg',
    );
  });

  // ------------------------------------
  // Input / Sending
  // ------------------------------------
  it('should update messageText via ngModel', () => {
    const input = fixture.debugElement.query(
      By.css('.chat-input input'),
    ).nativeElement;

    input.value = 'Hello test';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.messageText).toBe('Hello test');
  });

  it('should clear input after sending', () => {
    component.messageText = 'Test';
    component.sendMessage('Test');
    expect(component.messageText).toBe('');
  });

  it('should call sendMessage when clicking send button', () => {
    const button = fixture.debugElement.query(By.css('.chat-input button'));
    component.messageText = 'Hello';

    button.nativeElement.click();

    expect(component.messageText).toBe('');
  });

  // ------------------------------------
  // Timestamps
  // ------------------------------------
  it('should show timestamp for sent messages', () => {
    messagesSubject.next([mockMessages[0]]);
    fixture.detectChanges();

    const ts = fixture.debugElement.query(By.css('.sentTimestamp'));
    expect(ts).toBeTruthy();
  });

  it('should show timestamp for received messages', () => {
    messagesSubject.next([mockMessages[1]]);
    fixture.detectChanges();

    const ts = fixture.debugElement.query(By.css('.receivedTimestamp'));
    expect(ts).toBeTruthy();
  });

  // ------------------------------------
  // Edge cases
  // ------------------------------------
  it('should handle empty room id', () => {
    mockActivatedRoute.snapshot.paramMap.get = jest.fn(() => null);

    const f = TestBed.createComponent(ChatComponent);
    const c = f.componentInstance;

    expect(c.roomId).toBe('');
  });
});
