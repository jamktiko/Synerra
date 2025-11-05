import {
  Component,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatMessage } from '../../../core/interfaces/chatMessage';
import { UserStore } from '../../../core/stores/user.store';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  roomId: string = '';
  loggedInUser: any;
  // Sets an observable for the showing chat messages
  messages$: Observable<ChatMessage[]>;
  messageHistory: [] = [];
  chatPartnerName: string = '';
  chatPartnerPicture: any = '';

  messageText: string = '';

  // Points to the <div #chatLog> for ts usage
  @ViewChild('chatLog') chatLogRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private userStore: UserStore,
    private userService: UserService,
    private messageService: MessageService
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

    // Reactively tracks all reactive values used inside (userStore.user)
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.loggedInUser = user;
        console.log('LOGGEDINUSER', this.loggedInUser);
        // Starts a chat with roomId
        this.chatService.startChat(undefined, this.roomId);

        if (!this.chatPartnerName) {
          this.messages$.subscribe((messages) => {
            if (!messages || messages.length === 0) return;

            const otherUser = messages.find(
              (msg) =>
                msg.SenderId &&
                msg.SenderId !== this.loggedInUser?.UserId &&
                msg.SenderUsername
            );

            console.log('TOINEN KÄYTTÄJÄ', otherUser);

            if (otherUser) {
              this.chatPartnerName = otherUser.SenderUsername;
              this.chatPartnerPicture =
                otherUser.ProfilePicture || 'assets/svg/Acount.svg';
            }
          });
        }
      }
    });
  }

  ngOnInit() {
    this.clearNotifications();
  }

  // Runs once after the full component has been initialized. Since the scrollToBottom requires the html element,
  // we must to be sure that it dosen't run before the element has been initialized.
  ngAfterViewInit() {
    // Subscribing the chat logs for detecting a new message
    this.messages$.subscribe((make) => {
      // Clears message notifications when rendeting a new one
      this.clearNotifications();
      // Scrolls down (timeout for giving angular time to render the message)
      console.log('WOOOO', make);
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  // Closes the websocket connection when exiting the page
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

  clearNotifications() {
    this.userService.markRoomMessagesAsRead(this.roomId).subscribe({
      next: (res) => {
        console.log(`Messages in room ${this.roomId} marked as read`, res);
      },
      error: (err) => {
        console.error('Failed to mark messages as read', err);
      },
    });
  }

  scrollToBottom() {
    try {
      // Gets the actual exact html element via the ViewChild above.
      // Its not a copy or anything, but the exact element, so it can now be modified in ts.
      const element = this.chatLogRef.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch {}
  }
}
