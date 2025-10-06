import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ChatMessage } from '../../../core/interfaces/chatMessage';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  roomId: string = '';
  loggedInUser: any;
  // Sets an observable for the showing chat messages
  messages$: Observable<ChatMessage[]>;

  messageText: string = '';

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private userService: UserService
  ) {
    // Links the message observable to the chatService messages for reactive updating
    this.messages$ = this.chatService.logMessages$;
    console.log('MESSAAGE ', this.messages$);
  }

  ngOnInit() {
    // Gets the current roomId from the url social/:id
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    // Gets data about the logged-in user from the backend with JWT (mainly for the username)
    this.userService.getMe().subscribe({
      next: (res) => {
        this.loggedInUser = res;
        console.log('User info:', this.loggedInUser);
      },
      error: (err) => {
        console.error('Failed to fetch user info:', err);
      },
    });
    this.chatService.startChat(undefined, this.roomId);

    this.userService.markRoomMessagesAsRead(this.roomId).subscribe({
      next: (res) => {
        console.log(`Messages in room ${this.roomId} marked as read`, res);
      },
      error: (err) => {
        console.error('Failed to mark messages as read', err);
      },
    });
  }

  ngOnDestroy() {
    console.log('Closing websocket connection');
    this.chatService.exitRoom(this.roomId);
  }

  // Sends a message via chatService to the websocket server
  sendMessage(msg: string) {
    console.log('sending: ', msg);
    this.chatService.sendMessage(
      msg,
      this.loggedInUser.UserId,
      this.loggedInUser.Username,
      this.loggedInUser.ProfilePicture,
      this.roomId
    );
    // Clears the input slot
    this.messageText = '';
  }
}
