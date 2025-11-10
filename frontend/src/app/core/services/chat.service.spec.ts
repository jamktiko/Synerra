import { ChatService } from './chat.service';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';
import { MessageService } from './message.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { User } from '../interfaces/user.model';

// These get replaced with mocks, so that their behavior can be controlled in the tests + the real versions wont run (so no api / websocket calls)
jest.mock('../stores/auth.store');
jest.mock('../stores/user.store');
jest.mock('./message.service');
// Overrides angular's reactive behavior so that signals, effects etc. run in the right order in the tests. Fully AI made.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core');
  return {
    ...actual,
    effect: (fn: any) => fn(),
    runInInjectionContext: (injector: any, fn: any) => fn(),
  };
});

const testRoom = 'testRoom123';

xdescribe('ChatService', () => {
  let chatService: ChatService;
  let mockAuthStore: AuthStore;
  let mockUserStore: UserStore;
  let mockRouter: Router;
  let mockMessageService: MessageService;
  let wsSendMock: jest.Mock;
  let wsCloseMock: jest.Mock;

  beforeEach(() => {
    wsSendMock = jest.fn();
    wsCloseMock = jest.fn();

    // @ts-ignore
    // Overrides the actual webSocket constructor with a custom mock class.
    global.WebSocket = class {
      // readyState is websocket's way to tell if its active. 1 = active, so setting it here as we fake a connection.
      readyState = 1;
      // Replaces methods with mock ones for faking and tracking.
      send = wsSendMock;
      close = wsCloseMock;
      // Placeholders for the ws event handlers, as we dont actually want to activate them in the test
      onopen: () => void = () => {};
      onmessage: (e: any) => void = () => {};
      onclose: () => void = () => {};
      onerror: (err: any) => void = () => {};
    };

    // Mocking AuthStore and faking the getting of the JWT-token
    // AuthStore now requires a UserStore in constructor; pass a minimal stub for tests
    mockAuthStore = new AuthStore({} as UserStore);
    mockAuthStore.getToken = jest.fn().mockReturnValue('token123');

    // Making a new user
    const mockUser: User = { UserId: 'user1' };
    // Mocking the UserStore
    mockUserStore = {
      user: signal<User | null>(mockUser) as WritableSignal<User | null>,
      setUser: jest.fn(),
      clearUser: jest.fn(),
      getUser: jest.fn(),
    } as any;

    // Mocking the router
    mockRouter = { navigate: jest.fn() } as any;
    // Mocking the MessageService (chatHistory stored there)
    mockMessageService = {
      getMessages: jest.fn().mockReturnValue(of([])),
    } as any;

    // Sets up chatService, with the mocked dependencies
    chatService = new ChatService(
      mockAuthStore,
      mockUserStore,
      mockRouter,
      mockMessageService
    );
  });

  it('should send a message and update the chat log', () => {
    // Replaces chatService's webSocket property (ws) with a mock object, that has a send method.
    // Basically fakes the websocket and we can follow the calls that go to .send().
    // With the brackets [], we can access the private WS when running in js.
    chatService['ws'] = { send: wsSendMock } as any;

    // Sending a test message, that then activates the above wsSendMock, since we replaced the real .send().
    chatService.sendMessage('hi', 'user2', 'Make', 'kuva.png', testRoom);

    // First test rule. Checks that the .send() has been called.
    expect(wsSendMock).toHaveBeenCalled();

    // Gets the current chat logs and tests if it has gotten a value and if its the one we added.
    const messages = chatService.logMessagesSubject.getValue();
    expect(messages.length).toBe(1);
    expect(messages[0].Content).toBe('hi');
  });

  it('should add a log if the message is from another user', () => {
    // Same property replace process as in the previous test
    chatService['loggedInUser'] = { UserId: 'user1' } as any;

    // Adds a message to the chat log
    chatService.addLog({
      SenderId: 'user2',
      SenderUsername: 'Make',
      Content: 'Helo',
      ProfilePicture: '',
      Timestamp: Date.now(),
    });

    // Gets the current value form the chat log and tests if the sent message is there.
    const logs = chatService.logMessagesSubject.getValue();
    expect(logs.length).toBe(1);
    expect(logs[0].SenderId).toBe('user2');
  });

  it('should not add a log if the message is from loggedInUser', () => {
    // Same property replace process as in the previous tests
    chatService['loggedInUser'] = { UserId: 'user1' } as any;

    // Adds a message to the chatlog
    chatService.addLog({
      SenderId: 'user1',
      SenderUsername: 'Jaska',
      Content: 'Helo',
      ProfilePicture: '',
      Timestamp: Date.now(),
    });

    // Gets the current chatlog and expects the new message to not be there
    const logs = chatService.logMessagesSubject.getValue();
    expect(logs.length).toBe(0);
  });

  it('should close websocket on exitRoom', async () => {
    // Mocks a websocket instance
    const mockWs: any = {
      send: wsSendMock,
      close: wsCloseMock,
      onclose: undefined,
    };
    chatService['ws'] = mockWs;

    // Starts exitRoom (this sets ws.onclose internally)
    const exitPromise = chatService.exitRoom(testRoom);

    // Simulates websocket actually closing
    mockWs.onclose();

    await exitPromise;

    // Expects exitroom to have been called with the right roomId and ws not being active
    expect(wsSendMock).toHaveBeenCalledWith(
      JSON.stringify({ action: 'exitroom', data: testRoom })
    );
    expect(wsCloseMock).toHaveBeenCalled();
    expect(chatService['ws']).toBeNull();
  });

  it('should handle onopen and send the enterroom message', async () => {
    // Starts a mocked ws connection since we are testing the connection
    const wsOpenPromise = chatService.startChat(undefined, testRoom);

    // Simulating the ws opening
    const wsInstance = chatService['ws'] as any;
    wsInstance.onopen();
    // Manually sending the room entering message
    wsInstance.onmessage({
      data: JSON.stringify({ action: 'enterroom', targetRoomId: testRoom }),
    });

    // Expects the sendMessage function to have been called with the enterroom action.
    expect(wsSendMock).toHaveBeenCalledWith(
      JSON.stringify({ action: 'enterroom', targetRoomId: testRoom })
    );

    wsInstance.onclose();
    // Waits for the ws to return the promise in order for the test test to pass
    await wsOpenPromise;
  });

  it('should fetch chat history', async () => {
    // Starts the startChat method
    const chatPromise = chatService.startChat(undefined, testRoom);

    // Starts the mocked ws connection
    const wsInstance = chatService['ws'] as any;
    wsInstance.onopen();

    // Faking a process where the ws sends a message to the user (roomId)
    const roomMsg = { roomId: testRoom };
    wsInstance.onmessage({ data: JSON.stringify(roomMsg) });

    // Expects the reroute to have been called as the startChat functioin
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/dashboard/social',
      testRoom,
    ]);

    // Expects the room activating message
    expect(mockMessageService.getMessages).toHaveBeenCalledWith(testRoom);

    // Waits for the fake ws to "close" so that chatService can the return the promise. (apparently not mandatory but good practice to end the test)
    wsInstance.onclose();
    await chatPromise;
  });

  it('should handle incoming chat message and add it to log', async () => {
    // Again replaces a property like in the first test
    chatService['loggedInUser'] = { UserId: 'user1' } as any;

    // starts the startChat method
    const startPromise = chatService.startChat(undefined, testRoom);

    // Starts the mocked ws connection
    const wsInstance = chatService['ws'] as any;
    wsInstance.onopen();

    // Message we are fake sending
    const chatMsg = {
      SenderId: 'user2',
      SenderUsername: 'Bob',
      Content: 'Hi!',
      ProfilePicture: '',
      Timestamp: Date.now(),
    };
    // Sends the message
    wsInstance.onmessage({ data: JSON.stringify(chatMsg) });

    const logs = chatService.logMessagesSubject.getValue();
    console.log(logs);
    expect(logs.length).toBe(1);
    expect(logs[0].Content).toBe('Hi!');

    // Again "closes" the mocked ws for startChats's promise
    wsInstance.onclose();
    await startPromise;
  });

  it('should reject startChat if websocket gives errors', async () => {
    // Still starts the startChat method
    const promise = chatService.startChat(undefined, testRoom);

    // Starts the mocked ws connection
    const wsInstance = chatService['ws'] as any;
    // Creating and sending a manual error
    const err = new Error('WS error');
    wsInstance.onerror(err);

    // Expects the promise to reject
    await expect(promise).rejects.toBe(err);
  });
});
