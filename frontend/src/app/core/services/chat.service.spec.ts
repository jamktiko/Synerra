import { ChatService } from './chat.service';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';
import { MessageService } from './message.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { User } from '../interfaces/user.model';

jest.mock('../stores/auth.store');
jest.mock('../stores/user.store');
jest.mock('./message.service');

describe('ChatService', () => {
  let service: ChatService;
  let mockAuthStore: AuthStore;
  let mockUserStore: UserStore;
  let mockRouter: Router;
  let mockMessageService: MessageService;
  let wsSendMock: jest.Mock;
  let wsCloseMock: jest.Mock;

  beforeEach(() => {
    wsSendMock = jest.fn();
    wsCloseMock = jest.fn();

    // @ts-ignore override global WebSocket
    global.WebSocket = class {
      readyState = 1;
      send = wsSendMock;
      close = wsCloseMock;
      onopen: () => void = () => {};
      onmessage: (e: any) => void = () => {};
      onclose: () => void = () => {};
      onerror: (err: any) => void = () => {};
    };

    mockAuthStore = new AuthStore();
    mockAuthStore.getToken = jest.fn().mockReturnValue('token123');

    const mockUser: User = { UserId: 'u1' };

    mockUserStore = {
      user: signal<User | null>(mockUser) as WritableSignal<User | null>,
      setUser: jest.fn(),
      clearUser: jest.fn(),
      getUser: jest.fn(),
    } as any; // 'as any' bypasses extra strict typing

    mockRouter = { navigate: jest.fn() } as any;

    mockMessageService = {
      getMessages: jest.fn((roomId: string) => of([])),
    } as any;
    mockMessageService.getMessages = jest.fn().mockReturnValue(of([]));

    service = new ChatService(
      mockAuthStore,
      mockUserStore,
      mockRouter,
      mockMessageService,
    );
  });

  it('should send message and update log', () => {
    service['ws'] = { send: wsSendMock } as any;

    service.sendMessage('hi', 'u2', 'Bob', 'pic.png', 'room1');

    expect(wsSendMock).toHaveBeenCalled();
    const messages = service.logMessagesSubject.getValue();
    expect(messages.length).toBe(1);
    expect(messages[0].Content).toBe('hi');
  });

  it('should add log if message is from another user', () => {
    service['loggedInUser'] = { UserId: 'u1' } as any;

    service.addLog({
      SenderId: 'u2',
      SenderUsername: 'Bob',
      Content: 'Hello!',
      ProfilePicture: '',
      Timestamp: Date.now(),
    });

    const logs = service.logMessagesSubject.getValue();
    expect(logs.length).toBe(1);
    expect(logs[0].SenderId).toBe('u2');
  });

  it('should not add log if message is from loggedInUser', () => {
    service['loggedInUser'] = { UserId: 'u1' } as any;

    service.addLog({
      SenderId: 'u1',
      SenderUsername: 'Me',
      Content: 'Hello!',
      ProfilePicture: '',
      Timestamp: Date.now(),
    });

    const logs = service.logMessagesSubject.getValue();
    expect(logs.length).toBe(0);
  });

  it('should close websocket on exitRoom', async () => {
    service['ws'] = { send: wsSendMock, close: wsCloseMock } as any;

    await service.exitRoom('room1');

    expect(wsSendMock).toHaveBeenCalledWith(
      JSON.stringify({ action: 'exitroom', data: 'room1' }),
    );
    expect(wsCloseMock).toHaveBeenCalled();
    expect(service['ws']).toBeNull();
  });

  it('should handle onopen and send enterroom message', async () => {
    const wsOpenPromise = service.startChat(undefined, 'room42'); // using roomId

    const wsInstance = service['ws'] as any;
    wsInstance.onopen(); // simulate WebSocket open

    expect(wsSendMock).toHaveBeenCalledWith(
      JSON.stringify({ action: 'enterroom', targetRoomId: 'room42' }),
    );

    // simulate WebSocket closing after start
    wsInstance.onclose();
    await wsOpenPromise;
  });

  it('should handle incoming room join message and fetch chat history', async () => {
    await service.startChat(undefined, 'room42');

    const wsInstance = service['ws'] as any;

    const roomMsg = {
      roomId: 'room42',
    };
    wsInstance.onmessage({ data: JSON.stringify(roomMsg) });

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/dashboard/social',
      'room42',
    ]);
    expect(mockMessageService.getMessages).toHaveBeenCalledWith('room42');
  });

  it('should handle incoming chat message and add it to log', async () => {
    service['loggedInUser'] = { UserId: 'u1' } as any;
    await service.startChat(undefined, 'room42');

    const wsInstance = service['ws'] as any;

    const chatMsg = {
      SenderId: 'u2',
      SenderUsername: 'Bob',
      Content: 'Hi!',
      ProfilePicture: '',
      Timestamp: Date.now(),
    };

    wsInstance.onmessage({ data: JSON.stringify(chatMsg) });

    const logs = service.logMessagesSubject.getValue();
    expect(logs.length).toBe(1);
    expect(logs[0].Content).toBe('Hi!');
  });

  it('should reject startChat if websocket errors', async () => {
    const promise = service.startChat(undefined, 'room42');

    const wsInstance = service['ws'] as any;
    const err = new Error('WS error');
    wsInstance.onerror(err);

    await expect(promise).rejects.toBe(err);
  });
});
