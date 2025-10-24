import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
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
  public notifications$ = this.notificationsSubject.asObservable();
  private reconnectInterval = 3000;
  private hasSentType = false;
  private reconnecting = false;
  private pingInterval: any;
  private userSub: Subscription | null = null;

  constructor(private authStore: AuthStore, private userStore: UserStore) {
    this.token = this.authStore.getToken(); //get the users jwt token
  }

  //Initialize the connection
  public initConnection() {
    const tryConnect = () => {
      const user = this.userStore.user(); // get the logged in user
      if (!user || !this.token) {
        setTimeout(tryConnect, 200); // retry in 200ms
        return;
      }
      this.createWebSocket();
    };
    tryConnect();
  }

  // creates the websocket
  private createWebSocket() {
    const user = this.userStore.user();
    if (!user || !this.token) return;

    //Websocket-url
    const url = `${environment.WSS_URL}?Auth=${encodeURIComponent(
      this.token
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
      this.reconnecting = true;
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
}
