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
  messageNotifications: any[] = [];
  friendRequestNotifications: any[] = [];

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

    // Listens to unread messages
    this.userService.unreads$.subscribe({
      next: (messages) => {
        // Filter out friend requests
        this.unreads = messages.filter(
          (msg) => msg.Relation !== 'FRIEND_REQUEST'
        );
        console.log('Unread messages IN SOCIAL PAGEEEEE:', this.unreads);
      },
      error: (err) => console.error('Failed to load unread messages', err),
    });

    // Fetch initial data
    this.friendService.getPendingRequests().subscribe();
    this.userService.getUnreadMessages().subscribe();
    this.userService.fetchUnreadMessages();

    // Subscribe to incoming notifications
    this.sub = this.notificationService.notifications$.subscribe(
      (data: any) => {
        console.log(data.type);
        // Handle global clears first
        if (data.type === 'CLEAR_ALL_MESSAGES') {
          console.log('CLEARING MESSAGES');
          this.notifications = this.notifications.filter(
            (n) => n.type !== 'newMessage'
          );
          this.messageNotifications = [];

          return; // exit early
        }

        if (data.type === 'CLEAR_ALL_REQUESTS') {
          console.log('CLEARING REQUESTS');
          this.notifications = this.notifications.filter(
            (n) =>
              n.type !== 'friend_request' &&
              n.type !== 'friend_request_accepted' &&
              n.type !== 'friend_request_declined'
          );
          this.friendRequestNotifications = [];
          return; // exit early
        }

        console.log('Received notification in SOCIAL:', data);

        // Add to generic notifications
        this.notifications = [...this.notifications, data];

        const type = (data.type ?? '').toString().toLowerCase();

        // Real time messages
        const isMessage =
          type === 'newmessage' ||
          type === 'message' ||
          (data.Relation ?? '').toString().toUpperCase() === 'MESSAGE';

        if (isMessage) {
          const notif = {
            senderUsername:
              data.senderUsername ?? data.SenderUsername ?? 'Unknown',
            profilePicture:
              data.profilePicture ??
              data.ProfilePicture ??
              'assets/default-avatar.png',
            content: data.content ?? data.Content ?? '',
            timestamp: data.timestamp ?? data.Timestamp ?? Date.now(),
            senderId: data.senderId ?? data.SenderId,
          };

          this.messageNotifications = [...this.messageNotifications, notif];
          console.log(
            'messageNotifications updated:',
            this.messageNotifications
          );
        }

        // Real time friend requests
        const isFriendRequest =
          type === 'friend_request' ||
          type === 'friend_request_accepted' ||
          type === 'friend_request_declined' ||
          (data.Relation ?? '').toString().toUpperCase() === 'FRIEND_REQUEST';

        if (isFriendRequest) {
          const req = {
            fromUserId: data.fromUserId ?? data.senderId ?? data.SenderId,
            fromUsername:
              data.fromUsername ?? data.senderUsername ?? data.SenderUsername,
            senderPicture:
              data.fromPicture ??
              data.senderPicture ??
              data.SenderPicture ??
              'assets/svg/Acount.svg',
            type: type,
            timestamp: data.timestamp ?? Date.now(),
          };

          this.friendRequestNotifications = [
            ...this.friendRequestNotifications,
            req,
          ];
          console.log(
            'friendRequestNotifications updated:',
            this.friendRequestNotifications
          );
        }
      }
    );
  }

  tabSwitch(tab: string) {
    if (tab === 'notifications') {
      this.messagesTabShowing = false;
    } else if (tab === 'messages') {
      this.messagesTabShowing = true;
    }
  }
}
