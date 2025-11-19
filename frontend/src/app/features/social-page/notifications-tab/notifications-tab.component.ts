import { CommonModule } from '@angular/common';
import { Component, Input, input, output, SimpleChanges } from '@angular/core';
import { FriendRequest } from '../../../core/interfaces/friendrequest.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
import {
  NormalizedMessage,
  NormalizedRequest,
  UnreadMessage,
} from '../../../core/interfaces/chatMessage';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/interfaces/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { NotificationStore } from '../../../core/stores/notification.store';
@Component({
  standalone: true,
  selector: 'app-notifications-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.css',
})
export class NotificationsTabComponent {
  @Input() messages: NormalizedMessage[] | null = []; //messages
  @Input() friendRequests: NormalizedRequest[] | null = []; // friendrequestit
  @Input() totalCount: number | null = 0; // total notification count

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private userService: UserService,
    private notificationService: NotificationService,
    private notificationStore: NotificationStore
  ) {}

  // avoid null checks in template
  get safeFriendRequests(): NormalizedRequest[] {
    return this.friendRequests || [];
  }
  // Accept friend request
  acceptRequest(targetUserId: string) {
    const request = this.friendRequests?.find(
      (req) => req.fromUserId === targetUserId
    );
    const username = request?.fromUsername || 'User';

    this.friendService.acceptFriendRequest(targetUserId).subscribe({
      next: () => {
        //remove from local array
        this.friendRequests =
          this.friendRequests?.filter(
            (req) => req.fromUserId !== targetUserId
          ) || [];
        alert(`Friend request from ${username} accepted`);
      },
      error: (err) => console.error('Failed to accept request', err),
    });
  }

  declineRequest(targetUserId: string) {
    const request = this.friendRequests?.find(
      (req) => req.fromUserId === targetUserId
    );
    const username = request?.fromUsername || 'User';

    this.friendService.declineFriendRequest(targetUserId).subscribe({
      next: () => {
        //remove from local array
        this.friendRequests =
          this.friendRequests?.filter(
            (req) => req.fromUserId !== targetUserId
          ) || [];
        alert(`Friend request from ${username} declined`);
      },
      error: (err) => console.error('Failed to decline request', err),
    });
  }
  // clears accepted or declined requests from database and state
  clearRequest(userId: string) {
    this.friendService.clearAcceptedDeclinedRequests(userId).subscribe({
      next: (res) => {
        console.log(
          `Cleared ${res.deletedCount} accepted/declined requests from this user.`
        );
        // Update the store locally
        this.notificationStore.removeFriendRequest(userId);
      },
      error: (err) => {
        console.error('Failed to clear requests', err);
        alert('Failed to clear requests. Check console for details.');
      },
    });

    console.log(`Cleared requests from user ${userId}`);
  }

  // starts chat when clicking notification and removes notifications from that sender
  userClicked(roomId: string) {
    // remove notifications from the store
    this.notificationStore.removeNotificationsByRoom(roomId);

    // start the chat
    this.chatService.startChat(undefined, roomId);
  }
  // Mark all messages as read
  markAllAsRead() {
    this.notificationService.clearNotifications();
    this.userService.clearAllUnreads().subscribe({
      next: (res) => {
        console.log('Unreads cleared:', res);
      },
      error: (err) => {
        console.error('Failed to clear unreads', err);
      },
    });
    this.notificationStore.clearAllMessages();
  }

  // mark all requests as read
  markRequestsAsRead() {
    console.log('MARK REQUESTS AS READ CALLED');

    const requests = this.friendRequests || []; // fallback to empty array

    requests.forEach((r) => {
      const userId = r.fromUserId;
      if (!userId) return;

      // Decline pending requests to mark them as handled
      if (r.status === 'PENDING') {
        this.friendService.declineFriendRequest(userId).subscribe({
          error: (err) =>
            console.error('Failed to decline pending request for', userId, err),
        });
      } else {
        // Clear accepted/declined requests
        this.friendService.clearAcceptedDeclinedRequests(userId).subscribe({
          error: (err) =>
            console.error(
              'Failed to clear accepted/declined requests for',
              userId,
              err
            ),
        });
      }
    });

    this.notificationService.clearRequests(); // clear request notifications
  }
}
