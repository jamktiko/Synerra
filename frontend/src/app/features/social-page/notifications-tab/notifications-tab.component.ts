import { CommonModule } from '@angular/common';
import { Component, Input, input, output, SimpleChanges } from '@angular/core';
import { FriendRequest } from '../../../core/interfaces/friendrequest.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
import { UnreadMessage } from '../../../core/interfaces/chatMessage';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/interfaces/user.model';
import { NotificationService } from '../../../core/services/notification.service';
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
    private userService: UserService,
    private notificationService: NotificationService
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
  userClicked(roomId: string) {
    // Also remove from the generic notifications list
    this.notifications = this.notifications.filter((n) => n.roomId !== roomId);

    // Start the chat
    this.chatService.startChat(undefined, roomId);
  }

  // Mark all messages as read
  markAllAsRead() {
    // Normalize reactive notifications
    const reactiveMessages = this.notifications
      .filter((n) => n.type === 'newMessage')
      .map((n) => ({
        roomId: n.roomId,
      }));

    // Normalize database messages
    const dbMessages = this.unreads.map((n) => ({
      roomId: n.RoomId,
    }));

    // Merge and deduplicate by roomId
    const uniqueRoomIds = Array.from(
      new Set([...reactiveMessages, ...dbMessages].map((m) => m.roomId))
    );

    // Mark each room as read on the backend
    uniqueRoomIds.forEach((roomId) => {
      this.userService.markRoomMessagesAsRead(roomId).subscribe({
        error: (err) => console.error('Failed to mark room read', roomId, err),
      });
    });

    // Clear notifications and unreads locally
    this.notifications = this.notifications.filter(
      (n) => n.type !== 'newMessage'
    );
    this.unreads = [];
    this.notificationService.clearNotifications();
    this.userService.clearAllUnreads();
  }

  markRequestsAsRead() {
    console.log('MARK REQUESTS AS READ CALLED');

    //  Normalize reactive notifications
    const reactiveRequests = this.notifications
      .filter((n) => n.type === 'friend_request')
      .map((n) => ({
        userId: n.fromUserId,
        status: 'PENDING', // reactive friend requests are always pending
        username: n.fromUsername,
        picture: n.fromPicture,
      }));

    // Normalize DB pending requests
    const dbRequests = this.pendingRequests.map((req) => ({
      userId: req.SenderId,
      status: req.Status, // PENDING / ACCEPTED / DECLINED
      username: req.SenderUsername,
      picture: req.SenderPicture,
    }));

    // Merge and deduplicate by userId
    const allRequestsMap = new Map<
      string,
      { userId: string; status: string }
    >();
    [...reactiveRequests, ...dbRequests].forEach((r) => {
      if (!allRequestsMap.has(r.userId)) {
        allRequestsMap.set(r.userId, { userId: r.userId, status: r.status });
      }
    });
    const uniqueRequests = Array.from(allRequestsMap.values());

    console.log('Unique requests to process:', uniqueRequests);

    // Process requests
    uniqueRequests.forEach(({ userId, status }) => {
      if (!userId) return;

      if (status === 'PENDING') {
        // Declines pending requests
        this.friendService.declineFriendRequest(userId).subscribe({
          error: (err) =>
            console.error('Failed to decline pending request for', userId, err),
        });
      } else {
        // Accepted or declined requests are cleared
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

    //  Clear UI arrays
    this.notifications = this.notifications.filter(
      (n) => n.type !== 'friend_request'
    );
    this.notificationService.clearRequests();
    this.pendingRequests = [];
    this.friendService.clearAllRequests();
  }
}
