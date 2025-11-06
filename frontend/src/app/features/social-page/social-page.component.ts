import { Component, OnInit } from '@angular/core';
import { SocialMenuComponent } from './social-menu/social-menu.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { UserService } from '../../core/services/user.service';
import { UserStore } from '../../core/stores/user.store';
import { ChatService } from '../../core/services/chat.service';
import { NotificationsTabComponent } from './notifications-tab/notifications-tab.component';
import { MessagesTabComponent } from './messages-tab/messages-tab.component';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { FriendService } from '../../core/services/friend.service';
import { UnreadMessage } from '../../core/interfaces/chatMessage';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-social-page',
  imports: [
    CommonModule,
    SocialMenuComponent,
    NotificationsTabComponent,
    MessagesTabComponent,
  ],
  templateUrl: './social-page.component.html',
  styleUrl: './social-page.component.css',
})
export class SocialPageComponent implements OnInit {
  messagesTabShowing: boolean = true;

  directChats: any[] = [];
  groupChats: any[] = [];
  noChats: boolean = false;
  unreads: UnreadMessage[] = [];
  pendingRequests: FriendRequest[] = [];
  notifications: any[] = [];
  private sub: Subscription | null = null;

  constructor(
    private userService: UserService,
    private userStore: UserStore,
    private chatService: ChatService,
    private notificationService: NotificationService,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {
    const loggedInUser = this.userStore.getUser();
    if (loggedInUser?.UserId) {
      this.userService.getUserRooms(loggedInUser.UserId).subscribe({
        next: (res) => {
          const allChatRooms = res.rooms;
          console.log(allChatRooms);

          for (let room of allChatRooms) {
            // remove logged-in user from members
            room.Members = room.Members.filter(
              (m: any) => m.UserId !== loggedInUser.UserId
            );

            if (room.Members.length === 1) {
              this.directChats.push(room);
            } else if (room.Members.length > 1) {
              this.groupChats.push(room);
            } else {
              this.noChats = true;
            }
          }
        },
        error: (err) => {
          console.error('Failed to fetch rooms:', err);
        },
      });
    } else {
      console.error('No userId found');
    }
    // Listens to friend requests
    this.friendService.pendingRequests$.subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        console.log(
          'Pending friend requests ON SOCIAL PAGE:',
          this.pendingRequests
        );
      },
      error: (err) =>
        console.error('Failed to load pending requests ON SOCIAL PAGE', err),
    });

    // Fetch initial data
    this.friendService.getPendingRequests().subscribe();

    // Subscribe to incoming notifications
    this.sub = this.notificationService.notifications$.subscribe((data) => {
      console.log('Received notification in SOCIAL:', data);
      this.notifications.push(data);
      console.log(this.notifications);
    });
  }

  tabSwitch(tab: string) {
    if (tab === 'notifications') {
      this.messagesTabShowing = false;
    } else if (tab === 'messages') {
      this.messagesTabShowing = true;
    }
  }
}
