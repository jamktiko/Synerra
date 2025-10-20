import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/interfaces/user.model';
import { FriendService } from '../../../core/services/friend.service';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css'],
})
export class PlayerCardComponent {
  @Input() user!: User;

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private router: Router
  ) {}
  onProfile(): void {
    console.log(`Opening profile of ${this.user.Username}`);
    this.router.navigate(['/dashboard/profile']);
  }

  SendMsg(userId: any) {
    this.chatService.startChat([userId]);
  }

  onAddFriend() {
    if (!this.user?.UserId) return;

    this.friendService.sendFriendRequest(this.user.UserId).subscribe({
      next: (res) => {
        console.log('Friend request sent:', res);
        alert(`Friend request sent to ${this.user.Username}`);
      },
      error: (err) => {
        console.error('Error sending friend request', err);
        alert('Failed to send friend request');
      },
    });
  }
}
