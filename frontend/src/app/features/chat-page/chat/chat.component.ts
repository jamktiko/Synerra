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
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  roomId: string = '';
  loggedInUser: any;
  // Sets an observable for the showing chat messages
  messages$: Observable<ChatMessage[]>;
  messageHistory: [] = [];
  otherMembers: User[] = [];
  otherMemberNames: String | null = null;

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
        this.loadRoomMembers();
      }
    });
  }

  // Looping usernames here as there was problems in html
  get memberNames(): string {
    return (this.otherMembers ?? [])
      .map((m) => m?.Username || 'Chat')
      .join(', ');
  }

  ngOnInit() {
    this.clearNotifications();
    //subscribe to route params to detect change of chat room
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.roomId = id;

      this.loadRoomMembers();
    });
  }

  // loads roommembers
  loadRoomMembers() {
    if (!this.loggedInUser) return;

    this.messageService.getUserRooms(this.loggedInUser.UserId).subscribe({
      next: (res) => {
        const room = res.rooms.find((r: any) => r.RoomId === this.roomId);
        if (room) {
          this.otherMembers = room.Members.filter(
            (m: any) => m.PK.replace('USER#', '') !== this.loggedInUser.UserId // filter out logged in user
          );
          console.log('ORHETMEEMEMEME', this.otherMembers);
        }
      },
      error: (err) => console.error('Failed to fetch room members', err),
    });
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

  closeChat() {
    this.chatService.exitRoom(this.roomId);
  }
}
