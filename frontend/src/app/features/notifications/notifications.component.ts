import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  EmbeddedViewRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { UnreadMessage } from '../../core/interfaces/chatMessage';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { FriendService } from '../../core/services/friend.service';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [CommonModule],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  unreads: UnreadMessage[] = [];
  pendingRequests: FriendRequest[] = [];
  showDropdown = false;
  private sub: Subscription | null = null;
  notifications: any[] = [];

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private friendService: FriendService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Listens to friend requests
    this.friendService.pendingRequests$.subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        console.log('Pending friend requests:', this.pendingRequests);
      },
      error: (err) => console.error('Failed to load pending requests', err),
    });

    // Listens to unread messages
    this.userService.unreads$.subscribe({
      next: (messages) => {
        // filter out friend requests
        this.unreads = messages.filter(
          (msg) => msg.Relation !== 'FRIEND_REQUEST'
        );
        console.log('Unread messages:', this.unreads);
      },
      error: (err) => console.error('Failed to load unread messages', err),
    });

    // Ask for initial information
    this.userService.getUnreadMessages().subscribe();
    this.friendService.getPendingRequests().subscribe();
    this.userService.fetchUnreadMessages();

    // Subscribe to incoming notifications
    this.sub = this.notificationService.notifications$.subscribe((data) => {
      console.log('Received notification in component:', data);
      this.notifications.push(data);
      console.log(this.notifications);
    });
  }

  // accept friend request
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

  //decline friend request
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

  // toggle dropdown
  toggleDropdown() {
    this.setDropdownState(!this.showDropdown);
  }

  // badge-count
  get unreadCount(): number {
    return (
      (this.unreads?.length || 0) +
      (this.pendingRequests?.length || 0) +
      (this.notifications?.length || 0)
    );
  }

  // Starts chat when clicking notification
  userClicked(userId: string) {
    //Remove notifications from certain sender when clicked
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId; //sometimes payload differs so check many options

      return senderId !== userId;
    });
    this.chatService.startChat([userId]);
  }
  clearRequest(userId: string) {
    // clears the declined or accepted request from database
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

    //remove notifications of requests from certain sender
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
      return senderId !== userId;
    });
    // Remove from pending friend requests
    this.pendingRequests = this.pendingRequests.filter(
      (req) => req.SenderId !== userId && req.PK !== `USER#${userId}`
    );

    console.log(`Cleared requests from user ${userId}`);
  }
}
