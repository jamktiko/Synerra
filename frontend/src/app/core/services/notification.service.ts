import { Injectable, OnDestroy, effect } from '@angular/core';
import { filter, Subject, Subscription } from 'rxjs';
import { environment } from '../../../environment';
import { AuthStore } from '../stores/auth.store';
import { UserStore } from '../stores/user.store';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private notificationsSubject = new Subject<any>();
  private reconnectInterval = 3000;
  private hasSentType = false;
  private reconnecting = false;
  private pingInterval: any;
  private userSub: Subscription | null = null;

  constructor(
    private authStore: AuthStore,
    private userStore: UserStore,
  ) {
    effect(() => {
      const token = this.authStore.token();
      const user = this.userStore.user();
      if (token && user && !this.socket) {
        this.initConnection();
      }
    });
  }

  public notifications$ = this.notificationsSubject.asObservable().pipe(
    filter((msg) => msg.type !== 'USER_STATUS'), // ignore online_status messages
  );

  public userStatus$ = this.notificationsSubject
    .asObservable()
    .pipe(filter((msg) => msg.type === 'USER_STATUS'));
  //Initialize the connection
  public initConnection() {
    console.log('INIT CONNECTION CALLED');

    this.createWebSocket();
  }

  // creates the websocket
  private createWebSocket() {
    const user = this.userStore.user();
    this.token = this.authStore.getToken();
    if (!user || !this.token) return;

    //Websocket-url
    const url = `${environment.WSS_URL}?Auth=${encodeURIComponent(
      this.token,
    )}&type=notifications`;
    this.socket = new WebSocket(url);

    // When the connection has been made
    this.socket.onopen = () => {
      console.log('Notification WebSocket connected');
      this.reconnecting = false;
      if (!this.hasSentType) {
        this.send({ type: 'notifications' });
        this.hasSentType = true;
      }

      // Ping the connection so it doesn't close after a while of in-activity
      this.pingInterval = setInterval(
        () => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
          }
        },
        5 * 60 * 1000,
      );
    };

    // When the socket connection is closed
    this.socket.onclose = () => {
      console.log('Notification WebSocket disconnected, reconnecting...');
      this.socket = null;
      this.reconnecting = true;
      this.hasSentType = false;
      clearInterval(this.pingInterval);
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
      this.reconnecting = false;
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
  clearNotifications() {
    console.log('CLEAR MESSAGE NOTIFICATIONS CALLED');
    this.notificationsSubject.next({ type: 'CLEAR_ALL_MESSAGES' });
  }

  clearRequests() {
    console.log('CLEAR REQUEST NOTIFICATIONS CALLED');
    this.notificationsSubject.next({ type: 'CLEAR_ALL_REQUESTS' });
  }
}
