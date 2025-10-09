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
  pendingRequests: FriendRequest[] = [];
  showDropdown = false;

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {
    // Kuuntele friend requests
    this.friendService.pendingRequests$.subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        console.log('Pending friend requests:', this.pendingRequests);
      },
      error: (err) => console.error('Failed to load pending requests', err),
    });

    // Kuuntele unread messages
    this.userService.unreads$.subscribe({
      next: (messages) => {
        // suodatetaan FRIEND_REQUESTit pois
        this.unreads = messages.filter(
          (msg) => msg.Relation !== 'FRIEND_REQUEST'
        );
        console.log('Unread messages:', this.unreads);
      },
      error: (err) => console.error('Failed to load unread messages', err),
    });

    // Pyydetään aluksi palvelimelta tiedot
    this.userService.getUnreadMessages().subscribe();
    this.friendService.getPendingRequests().subscribe();
  }

  // hyväksy friend request
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

  // hylkää friend request
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
    this.showDropdown = !this.showDropdown;
  }

  // badge-lukumäärä
  get unreadCount(): number {
    return (this.unreads?.length || 0) + (this.pendingRequests?.length || 0);
  }

  // aloittaa chatin kun klikkaa notifikaatiota
  userClicked(userId: string) {
    this.chatService.startChat([userId]);
  }
}
