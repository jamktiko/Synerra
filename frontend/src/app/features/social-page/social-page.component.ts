import { Component, OnInit } from '@angular/core';
import { SocialMenuComponent } from './social-menu/social-menu.component';
import { UserService } from '../../core/services/user.service';
import { UserStore } from '../../core/stores/user.store';
import { NotificationsTabComponent } from './notifications-tab/notifications-tab.component';
import { MessagesTabComponent } from './messages-tab/messages-tab.component';
import { CommonModule } from '@angular/common';
import {
  NormalizedMessage,
  NormalizedRequest,
} from '../../core/interfaces/chatMessage';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { NotificationStore } from '../../core/stores/notification.store';
import { WebsocketFriendRequest } from '../../core/interfaces/friend.model';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

type AnyRequest = FriendRequest | WebsocketFriendRequest;
@Component({
  selector: 'app-social-page',
  imports: [
    CommonModule,
    SocialMenuComponent,
    NotificationsTabComponent,
    MessagesTabComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './social-page.component.html',
  styleUrl: './social-page.component.css',
})
export class SocialPageComponent implements OnInit {
  messagesTabShowing: boolean = true;

  directChats: any[] = [];
  groupChats: any[] = [];
  noChats: boolean = false;
  messages$: Observable<NormalizedMessage[]>; // observable of normalized message notifications
  friendRequests$: Observable<NormalizedRequest[]>; // observable of normalized friend requests
  totalCount$: Observable<number>; // total count of messages + requests
  loadingSpinnerShowing = true;

  private sub: Subscription | null = null;

  constructor(
    private userService: UserService,
    private userStore: UserStore,
    private notificationStore: NotificationStore,
  ) {
    // normalize messages from notification store
    this.messages$ = this.notificationStore.messageNotifications.pipe(
      map((msgs) =>
        msgs.map((m) => ({
          senderUsername: m.senderUsername || 'Unknown',
          content: m.content || '',
          timestamp: m.timestamp || Date.now(),
          roomId: m.roomId || '',
          profilePicture: m.profilePicture || '',
        })),
      ),
    );

    // Normalize friend requests from NotificationStore
    this.friendRequests$ = this.notificationStore.friendRequests.pipe(
      map((reqs) =>
        reqs.map((r: AnyRequest) => {
          let status: 'PENDING' | 'ACCEPTED' | 'DECLINED' = 'PENDING';
          let type: string;

          // WebSocket request has 'type'
          if ('type' in r && r.type) {
            type = r.type;
            if (type === 'friend_request') status = 'PENDING';
            else if (type === 'friend_request_accepted') status = 'ACCEPTED';
            else if (type === 'friend_request_declined') status = 'DECLINED';
          } else if ('Status' in r && r.Status) {
            status = r.Status as 'PENDING' | 'ACCEPTED' | 'DECLINED';
            // derive type from status
            type =
              status === 'PENDING'
                ? 'friend_request'
                : status === 'ACCEPTED'
                  ? 'friend_request_accepted'
                  : 'friend_request_declined';
          } else {
            // fallback if neither exists
            type = 'friend_request';
          }

          const fromUserId =
            'fromUserId' in r ? r.fromUserId : (r as any).SenderId;
          const fromUsername =
            'fromUsername' in r
              ? r.fromUsername
              : (r as any).SenderUsername || 'Unknown';
          const timestamp =
            'timestamp' in r ? r.timestamp : (r as any).Timestamp || Date.now();
          const senderPicture =
            'senderPicture' in r
              ? r.senderPicture
              : (r as any).SenderPicture || (r as any).fromPicture || '';
          const toUserId = (r as any).toUserId ?? '';

          const message =
            status === 'PENDING'
              ? `${fromUsername} sent you a friend request`
              : status === 'ACCEPTED'
                ? `${fromUsername} accepted your friend request`
                : `${fromUsername} declined your friend request`;

          return {
            fromUserId,
            fromUsername,
            timestamp,
            senderPicture,
            status,
            toUserId,
            type, // guaranteed string
            message,
          };
        }),
      ),
    );
    // Combine messages and requests to get total count for badge display
    this.totalCount$ = combineLatest([
      this.messages$,
      this.friendRequests$,
    ]).pipe(map(([msgs, reqs]) => msgs.length + reqs.length));
  }

  ngOnInit(): void {
    const loggedInUser = this.userStore.getUser();
    if (loggedInUser?.UserId) {
      // Fetch all chat rooms for logged-in user
      this.userService.getUserRooms(loggedInUser.UserId).subscribe({
        next: (res) => {
          const allChatRooms = res.rooms;
          console.log(allChatRooms);

          for (let room of allChatRooms) {
            // remove logged-in user from members
            room.Members = room.Members.filter(
              (m: any) => m.UserId !== loggedInUser.UserId,
            );

            if (room.Members.length === 1) {
              this.directChats.push(room);
            } else if (room.Members.length > 1) {
              this.groupChats.push(room);
            } else {
              this.noChats = true;
            }
          }
          this.loadingSpinnerShowing = false;
        },
        error: (err) => {
          console.error('Failed to fetch rooms:', err);
        },
      });
    } else {
      console.error('No userId found');
    }
  }

  // Switch between messages and notifications tab
  tabSwitch(tab: string) {
    if (tab === 'notifications') {
      this.messagesTabShowing = false;
    } else if (tab === 'messages') {
      this.messagesTabShowing = true;
    }
  }
}
