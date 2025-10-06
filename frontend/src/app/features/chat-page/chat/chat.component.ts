import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatMessage } from '../../../core/interfaces/chatMessage';
import { UserStore } from '../../../core/stores/user.store';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnDestroy {
  roomId: string = '';
  loggedInUser: any;
  // Sets an observable for the showing chat messages
  messages$: Observable<ChatMessage[]>;

  messageText: string = '';

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private userStore: UserStore,
  ) {
    // Links the message observable to the chatService messages for reactive updating
    this.messages$ = this.chatService.logMessages$;
    console.log('MESSAAGE ', this.messages$);

    // Gets the roomId from the current url
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.roomId = id;

    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.loggedInUser = user;
        console.log('LOGGEDINUSER', this.loggedInUser);
        this.chatService.startChat(undefined, this.roomId);
      }
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
      this.roomId,
    );
    // Clears the input slot
    this.messageText = '';
  }
}
