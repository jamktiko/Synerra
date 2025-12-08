import { Injectable, OnDestroy, effect } from '@angular/core';
import { filter, Subject, Subscription } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';
import { User } from '../interfaces/user.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private user: User | null = null;
  private notificationsSubject = new Subject<any>();
  private reconnectInterval = 3000;
  private hasSentType = false;
  private connecting = false;
  private pingInterval: any;
  private userSub: Subscription | null = null;

  constructor(private authStore: AuthStore, private userStore: UserStore) {
    // Tries to create a ws connection every time token or user updates in stores
    // The ws is must not be started from anywhere else in the app
    effect(() => {
      this.token = this.authStore.token();
      this.user = this.userStore.user();
      if (this.token && this.user && !this.socket) {
        this.initConnection();
      }
    });
  }

  public notifications$ = this.notificationsSubject.asObservable().pipe(
    filter((msg) => msg.type !== 'USER_STATUS') // ignore online_status messages
  );

  public userStatus$ = this.notificationsSubject
    .asObservable()
    .pipe(filter((msg) => msg.type === 'USER_STATUS'));
  //Initialize the connection
  public initConnection() {
    console.log('INIT CONNECTION CALLED');
    console.log('JOO', this.token, this.user);

    if (this.socket || this.connecting) {
      console.log('Canceling connection: ', this.socket, this.connecting);
      return;
    }

    this.connecting = true;
    this.createWebSocket();
  }

  // creates the websocket
  private createWebSocket() {
    if (!this.user || !this.token) {
      console.log('Canceling connection...');
      this.connecting = false;
      return;
    }

    //Websocket-url
    const url = `${environment.WSS_URL}?Auth=${encodeURIComponent(
      this.token
    )}&type=notifications`;
    this.socket = new WebSocket(url);

    // When the connection has been made
    this.socket.onopen = () => {
      console.log('Notification WebSocket connected');
      this.connecting = false;
      if (!this.hasSentType) {
        this.send({ type: 'notifications' });
        this.hasSentType = true;
      }

      // Ping the connection so it doesn't close after a while of in-activity
      this.pingInterval = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 5 * 60 * 1000);
    };

    // When the socket connection is closed
    this.socket.onclose = () => {
      console.log('Notification WebSocket disconnected, reconnecting...');
      this.socket = null;
      this.connecting = false;
      this.hasSentType = false;
      clearInterval(this.pingInterval);

      if (!this.token || !this.user) {
        return;
      }

      setTimeout(() => this.initConnection(), this.reconnectInterval);
    };

    //Error handling
    this.socket.onerror = (err) => console.error('WebSocket error', err);

    // When notifications are being received
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Notification received:', data);

        this.notificationsSubject.next(data);
      } catch (err) {
        console.error('Error parsing notification message', err);
      }
    };
  }

  close() {
    if (this.socket) {
      console.log('CLOSING WEBSOCKET CONNECTION');
      this.socket.close(); // properly closes the connection
      this.socket = null;
      this.hasSentType = false;
      clearInterval(this.pingInterval); // stop pinging
    }
  }
  //Send method used for the pinging so the connection stays open when AFK
  public send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  //When the component is closed
  ngOnDestroy(): void {
    if (this.socket) this.socket.close();
    if (this.userSub) this.userSub.unsubscribe();
    this.notificationsSubject.complete();
  }

  //clears all messages
  clearNotifications() {
    console.log('CLEAR MESSAGE NOTIFICATIONS CALLED');
    this.notificationsSubject.next({ type: 'CLEAR_ALL_MESSAGES' });
  }

  //clears all requests
  clearRequests() {
    console.log('CLEAR REQUEST NOTIFICATIONS CALLED');
    this.notificationsSubject.next({ type: 'CLEAR_ALL_REQUESTS' });
  }
}
