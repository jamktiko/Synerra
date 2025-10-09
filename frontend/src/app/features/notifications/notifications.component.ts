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
    // Initial load
    this.friendService.getPendingRequests().subscribe();

    // Reactive updates
    this.friendService.pendingRequests$.subscribe((requests) => {
      this.pendingRequests = requests;
      console.log('REQUESTIT', this.pendingRequests);
    });

    // Reactive unreads from userService
    this.userService.getUnreadMessages().subscribe();
    this.userService.unreads$.subscribe((res) => {
      this.unreads = res;
      this.unreads = res.filter((msg) => msg.Relation !== 'FRIEND_REQUEST');
      console.log('UNREADIT', this.unreads, res);
    });
  }

  // VANHA FUNKTIO
  // loadUnreads() {
  //   this.userService.getUnreadMessages().subscribe({
  //     next: (res) => {
  //       this.unreads = res;
  //       console.log('Unread messages:', res);
  //     },
  //     error: (err) => {
  //       console.error('Failed to load unread messages', err);
  //     },
  //   });
  // }

  // VANHA FUNKTIO
  // loadPendingRequests() {
  //   this.friendService.getPendingRequests().subscribe({
  //     next: (res) => {
  //       this.pendingRequests = res.pendingRequests;
  //       console.log('Pending friend requests:', this.pendingRequests);
  //     },
  //     error: (err) => {
  //       console.error('Failed to load pending requests', err);
  //     },
  //   });
  // }

  // method to accept a friend request
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

  // method to decline a friend request
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
