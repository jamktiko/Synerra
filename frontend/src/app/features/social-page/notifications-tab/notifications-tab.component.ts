import { CommonModule } from '@angular/common';
import { Component, Input, input, output, SimpleChanges } from '@angular/core';
import { FriendRequest } from '../../../core/interfaces/friendrequest.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
import { UnreadMessage } from '../../../core/interfaces/chatMessage';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/interfaces/user.model';
@Component({
  standalone: true,
  selector: 'app-notifications-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.css',
})
export class NotificationsTabComponent {
  @Input() friendRequestNotifications!: any[];
  @Input() messageNotifications!: any[];
  @Input() pendingRequests!: FriendRequest[];
  @Input() unreads!: UnreadMessage[];
  @Input() notifications!: any[];

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private userService: UserService
  ) {}
  // get friendRequestNotifications() {
  //   return this.notifications.filter(
  //     (n) =>
  //       n.type === 'friend_request' ||
  //       n.type === 'friend_request_accepted' ||
  //       n.type === 'friend_request_declined'
  //   );
  // }

  // Accept friend request
  acceptRequest(targetUserId: string) {
    const request = this.pendingRequests.find(
      (req) => req.PK === `USER#${targetUserId}`
    );
    const username = request?.SenderUsername || 'User';

    this.friendService.acceptFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
        alert(`Friend request from ${username} accepted`);
      },
      error: (err) => console.error('Failed to accept request', err),
    });
  }

  // Decline friend request
  declineRequest(targetUserId: string) {
    const request = this.pendingRequests.find(
      (req) => req.PK === `USER#${targetUserId}`
    );
    const username = request?.SenderUsername || 'User';

    this.friendService.declineFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
        alert(`Friend request from ${username} declined`);
      },
      error: (err) => console.error('Failed to decline request', err),
    });
  }

  // Clears accepted or declined requests from database and state
  clearRequest(userId: string) {
    this.friendService.clearAcceptedDeclinedRequests(userId).subscribe({
      next: (res) => {
        console.log(
          `Cleared ${res.deletedCount} accepted/declined requests from this user.`
        );
      },
      error: (err) => {
        console.error('Failed to clear requests', err);
        alert('Failed to clear requests. Check console for details.');
      },
    });

    // Remove notifications from this sender
    this.friendRequestNotifications = this.friendRequestNotifications.filter(
      (n) => {
        const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
        return senderId !== userId;
      }
    );

    // Remove requests from local list
    this.pendingRequests = this.pendingRequests.filter(
      (req) => req.SenderId !== userId && req.PK !== `USER#${userId}`
    );

    console.log(`Cleared requests from user ${userId}`);
  }

  // Starts chat when clicking notification and removes notifications from that sender
  userClicked(userId: string) {
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
      return senderId !== userId;
    });
    this.chatService.startChat([userId]);
  }

  // Mark all messages as read
  markAllAsRead() {
    // Mark unread messages in rooms as read
    if (this.unreads?.length) {
      const roomIds = Array.from(new Set(this.unreads.map((m) => m.RoomId)));
      roomIds.forEach((roomId) => {
        this.userService.markRoomMessagesAsRead(roomId).subscribe({
          error: (err) =>
            console.error('Failed to mark room read', roomId, err),
        });
      });
    }

    // Clear all message notifications
    this.notifications = this.notifications.filter(
      (n) => n.type !== 'newMessage'
    );

    // Clear unreads
    this.unreads = [];
  }

  markRequestsAsRead() {
    // Remove all friend request notifications from notifications array
    this.notifications = this.notifications.filter(
      (n) =>
        n.type !== 'friend_request' &&
        n.type !== 'friend_request_accepted' &&
        n.type !== 'friend_request_declined'
    );

    // clear pendingRequests if you want to mark them read locally
    this.pendingRequests = [];
  }
}
