import { CommonModule } from '@angular/common';
import { Component, Input, input, output, SimpleChanges } from '@angular/core';
import { FriendRequest } from '../../../core/interfaces/friendrequest.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
@Component({
  standalone: true,
  selector: 'app-notifications-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.css',
})
export class NotificationsTabComponent {
  @Input() notifications!: any[];
  @Input() pendingRequests!: FriendRequest[];

  constructor(private friendService: FriendService) {}
  get friendRequestNotifications() {
    return this.notifications.filter(
      (n) =>
        n.type === 'friend_request' ||
        n.type === 'friend_request_accepted' ||
        n.type === 'friend_request_declined'
    );
  }

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
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
      return senderId !== userId;
    });

    // Remove requests from local list
    this.pendingRequests = this.pendingRequests.filter(
      (req) => req.SenderId !== userId && req.PK !== `USER#${userId}`
    );

    console.log(`Cleared requests from user ${userId}`);
  }
}
