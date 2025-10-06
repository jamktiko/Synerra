import { Component, OnInit } from '@angular/core';
import { UnreadMessage } from '../../core/interfaces/chatMessage';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { FriendService } from '../../core/services/friend.service';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [CommonModule],
})
export class NotificationsComponent implements OnInit {
  unreads: UnreadMessage[] = [];
  showDropdown = false;
  pendingRequests: FriendRequest[] = [];

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private friendService: FriendService
  ) {}

  // on init load the unread messages and pending friend requests
  ngOnInit(): void {
    this.loadUnreads();
    this.loadPendingRequests();
  }

  // loads the unread messages
  loadUnreads() {
    this.userService.getUnreadMessages().subscribe({
      next: (res) => {
        this.unreads = res;
        console.log('Unread messages:', res);
      },
      error: (err) => {
        console.error('Failed to load unread messages', err);
      },
    });
  }

  // loads pending friend requests
  loadPendingRequests() {
    this.friendService.getPendingRequests().subscribe({
      next: (res) => {
        this.pendingRequests = res.pendingRequests;
        console.log('Pending friend requests:', res);
      },
      error: (err) => {
        console.error('Failed to load pending requests', err);
      },
    });
  }

  // method to accept a friend request
  acceptRequest(targetUserId: string) {
    this.friendService.acceptFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
        alert(`Friend request accepted}`);
      },
      error: (err) => console.error('Failed to accept request', err),
    });
  }

  // method to decline a friend request
  declineRequest(targetUserId: string) {
    this.friendService.declineFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
      },
      error: (err) => console.error('Failed to decline request', err),
    });
  }

  // toggler for the notifications drowdown
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // counts the unread messages + friend requests
  get unreadCount(): number {
    return (this.unreads?.length || 0) + (this.pendingRequests?.length || 0);
  }

  // starts the chat when u click the notification
  userClicked(userId: any) {
    this.chatService.startChat([userId]);
  }
}
