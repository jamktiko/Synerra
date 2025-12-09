import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket$!: WebSocketSubject<any>;

  // connect to the websocket
  connect(token: string) {
    this.socket$ = webSocket(
      `wss://k1z7vrtiik.execute-api.eu-north-1.amazonaws.com/dev?Auth=${token}`
    );
    return this.socket$;
  }

  //send message that is broadcasted to other connections
  sendMessage(msg: any) {
    this.socket$.next(msg);
  }

  //close the connection
  close() {
    this.socket$.complete();
  }
}
