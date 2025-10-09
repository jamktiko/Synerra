import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { ChatMessage } from '../interfaces/chatMessage';
import { AuthStore } from '../stores/auth.store';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private baseUrl = `${environment.AWS_BASE_URL}/messages`;

  constructor(
    private http: HttpClient,
    private authStore: AuthStore,
  ) {}

  // Gets the message history of a chatRoom.
  getMessages(roomId: string): Observable<ChatMessage[]> {
    const token = this.authStore.getToken();
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/${roomId}`, {
      headers: {
        Authorization: `${token}`,
      },
    });
  }
}
