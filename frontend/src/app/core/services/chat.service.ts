// This file handles the whole frontend chat logic

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../interfaces/chatMessage';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private uri: string = '';
  private currentRoomId = null;

  // Sets up a Behavioral Subject for frontend to keep track of the current chat logs
  private logMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  // Observable for the chat logs, so components can see the chat logs reactively. $-sign is commonly used for telling that a variable is an observable.
  logMessages$ = this.logMessagesSubject.asObservable();

  constructor(
    private authStore: AuthStore,
    private router: Router,
  ) {
    this.token = this.authStore.getToken();
    this.uri = `${environment.WSS_URL}?Auth=${this.token}`; // AWS wss url
  }

  // This starts the whole websocket process
  startChat(targetUserId: string[]) {
    // If there is an active roomId when opening websocket connection, the previous connection closes
    if (this.currentRoomId) {
      console.log('POISTUU');
      this.exitRoom(this.currentRoomId);
    }
    return new Promise<void>((resolve, reject) => {
      this.ws = new WebSocket(this.uri); // Creates new websocket connection

      // Activates when a successful connection between server and client has been made
      this.ws.onopen = () => {
        // Sends a message
        this.addLog({
          senderId: 'system',
          senderUsername: 'system',
          message: 'Connected to server',
        });
        // Tells the server that the user wants to create/enter a chatroom with the userIds in the [targetUserId]
        this.ws!.send(JSON.stringify({ action: 'enterroom', targetUserId }));
        console.log('Websocket connection successful');
      };

      // Activates when the websocket server sends a message
      this.ws.onmessage = (e) => {
        console.log('Message: ', e);
        try {
          // Parses the message to usable form
          const msg = JSON.parse(e.data);
          this.currentRoomId = msg.roomId;
          // The backend sends 2 kind of messages. The first type is sent when the user joins a new room.
          // The second type is sent when the user sends a message inside of a room.
          // If the e.data has senderId and message on it, it means that the received action is a message being sent.
          if (msg.senderId && msg.message) {
            // Uses addLog to show the received message in the frontend
            this.addLog(msg);
            // If the e.data has roomId on it, it means that the received action is about joining a new room.
          } else if (msg.roomId) {
            // Routes the user to the new room in frontend
            this.router.navigate(['/dashboard/social', msg.roomId]);
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
          senderId: 'system',
          senderUsername: 'system',
          message: 'Connection closed',
        });
    });
  }

  // Sends a message to the websocket server
  sendMessage(msg: string, userId: string, userName: string, roomId: string) {
    // If no websocket connection or message, it breaks.
    if (!this.ws || !msg) {
      console.log('returning ', this.ws, msg);
      return;
    }

    // Gathering all the data that is being sent to the server
    const payload = {
      action: 'sendmessage',
      data: {
        senderId: userId,
        senderUsername: userName,
        roomId,
        message: msg,
        timestamp: Date.now(),
      },
    };

    console.log('Sending structured message:', payload);
    // sends the data to the websocket server
    this.ws.send(JSON.stringify(payload));
  }

  // Closes the whole websocket connection
  exitRoom(roomId: string) {
    // Checks that there is an active websocket connection
    if (!this.ws) return;
    // Tells the server to close the connection and do the whole closing process
    this.ws.send(JSON.stringify({ action: 'exitroom', data: roomId }));
    // Closes the connection between the client and the server
    this.ws.close();
    // Nulls the websocket for new future connections
    this.ws = null;
  }

  // Adds a received message to the behavioral subject for showing it for the user in frontend.
  addLog(msg: { senderId: string; senderUsername: string; message: string }) {
    const current = this.logMessagesSubject.getValue();
    this.logMessagesSubject.next([...current, msg]);
  }
}
