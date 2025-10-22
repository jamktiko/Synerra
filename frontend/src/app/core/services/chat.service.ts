// This file handles the whole frontend chat logic

import { Injectable, effect } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../interfaces/chatMessage';
import { User } from '../interfaces/user.model';
import { MessageService } from './message.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private uri: string = '';
  private currentRoomId: string | null = null;
  private loggedInUser: User | null = null;

  // Sets up a Behavioral Subject for frontend to keep track of the current chat logs
  public logMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  // Observable for the chat logs, so components can see the chat logs reactively. $-sign is commonly used for telling that a variable is an observable.
  logMessages$ = this.logMessagesSubject.asObservable();

  constructor(
    private authStore: AuthStore,
    private userStore: UserStore,
    private router: Router,
    private messageService: MessageService,
  ) {
    this.token = this.authStore.getToken();
    this.uri = `${environment.WSS_URL}?Auth=${this.token}`;

    effect(() => {
      this.loggedInUser = this.userStore.user();
    });
  }

  // This starts the whole websocket process
  // Needs either targetRoomId or [targetUserId]. not both, not none.
  async startChat(targetUserId?: string[], targetRoomId?: string) {
    // If there is an active roomId when opening websocket connection, the previous connection closes
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.warn(
        'Existing WebSocket detected. Closing it before starting a new one.',
      );
      await this.exitRoom(this.currentRoomId ?? '');
    }

    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.uri); // Creates new websocket connection

      // Activates when a successful connection between server and client has been made
      this.ws.onopen = () => {
        // Tells the server to create/enter a room with either targetUserIds or chatRoomId, depending on how the startChat() was called.
        if (targetUserId && !targetRoomId) {
          this.ws!.send(
            JSON.stringify({
              action: 'enterroom',
              targetUserId,
            }),
          );
        } else if (targetRoomId && !targetUserId) {
          this.ws!.send(
            JSON.stringify({
              action: 'enterroom',
              targetRoomId,
            }),
          );
        }
        console.log('Websocket connection successful');
      };

      // Activates when the websocket server sends a message
      this.ws.onmessage = (e) => {
        console.log('Message: ', e);

        try {
          // Parses the message to usable form
          const msg = JSON.parse(e.data);
          this.currentRoomId = msg.RoomId;
          // The backend sends 2 kind of messages. The first type is sent when the user joins a new room.
          // The second type is sent when the user sends a message inside of a room.
          // If the e.data has senderId and message on it, it means that the received action is a message being sent.
          if (msg.SenderId && msg.Content) {
            // Uses addLog to show the received message in the frontend
            this.addLog(msg);
            // If the e.data has roomId on it, it means that the received action is about joining a new room.
          } else if (msg.roomId) {
            // Routes the user to the new room in frontend
            this.router.navigate(['/dashboard/social', msg.roomId]);

            this.logMessagesSubject.next([]);

            // Gets the chat history of a room and adds it to the chat messages$, that holds the chatlogs
            this.messageService.getMessages(msg.roomId).subscribe({
              next: (messages) => {
                console.log('yhistääÄÄÄä', messages);
                const current = this.logMessagesSubject.getValue();
                this.logMessagesSubject.next([...messages, ...current]);
              },
              error: (err) => {
                console.error('Failed to fetch messages:', err);
              },
            });
          }
        } catch (err) {
          console.error('Failed to parse message', e.data);
        }
      };

      // In case of an unexpected error, this ends the whole startChat process.
      this.ws.onerror = (err) => reject(err);

      // Sends a message to the user when the websocket connection is cut.
      this.ws.onclose = () =>
        this.addLog({
          SenderId: 'system',
          SenderUsername: 'system',
          Content: 'Connection closed',
          ProfilePicture: 'assets/svg/Acount.svg',
          Timestamp: Date.now(),
        });
    });
  }

  // Sends a message to the websocket server
  sendMessage(
    content: string,
    userId: string,
    userName: string,
    profilePicture: string,
    roomId: string,
  ) {
    // If no websocket connection or message, it breaks.
    if (!this.ws || !content) {
      console.log('returning ', this.ws, content);
      return;
    }

    if (!this.loggedInUser) {
      console.log('Not logged in');
    }

    // Gathering all the data that is being sent to the server
    const payload = {
      action: 'sendmessage',
      data: {
        SenderId: userId,
        SenderUsername: userName,
        ProfilePicture: profilePicture,
        RoomId: roomId,
        Content: content,
        Timestamp: Date.now(),
      },
    };

    // Own object for the message that shows for the frontend user immediately
    const message = {
      SenderId: userId,
      SenderUsername: userName,
      Content: content,
      ProfilePicture: profilePicture,
      Timestamp: Date.now(),
    };

    try {
      console.log('Sending message to WS:', payload);
      // sends the data to the websocket server
      this.ws.send(JSON.stringify(payload));

      // Gets the current websocket chatlog and adds the new message there
      // (immediately after sending the message to the server, not waiting for the addLog to catch it for more responsive user experience)
      const current = this.logMessagesSubject.getValue();
      this.logMessagesSubject.next([...current, message]);
    } catch (error) {
      console.log('WS send failed', error);

      this.addLog({
        SenderId: 'system',
        SenderUsername: 'system',
        Content: 'Sending message failed',
        ProfilePicture: 'assets/svg/Acount.svg',
        Timestamp: Date.now(),
      });
    }
  }

  // Closes the whole websocket connection
  async exitRoom(roomId: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) return resolve();

      // This activates last, after the websocket closes (ws.close)
      this.ws.onclose = () => {
        this.ws = null;
        this.currentRoomId = null;
        this.logMessagesSubject.next([]);
        resolve();
      };

      if (roomId) {
        this.ws.send(JSON.stringify({ action: 'exitroom', data: roomId }));
      }

      this.ws.close();
    });
  }

  // Adds a received message to the behavioral subject for showing it for the user in frontend.
  addLog(msg: {
    SenderId: string;
    SenderUsername: string;
    Content: string;
    ProfilePicture: string;
    Timestamp: number;
  }) {
    // If the message was sent by the loggedInUser,
    // it will not be added to the showing chatlog as the message was already added there by sendMessage().
    if (msg.SenderId !== this.loggedInUser?.UserId) {
      console.log(msg.SenderId, this.loggedInUser?.UserId);
      const current = this.logMessagesSubject.getValue();
      this.logMessagesSubject.next([...current, msg]);
    }
  }
}
