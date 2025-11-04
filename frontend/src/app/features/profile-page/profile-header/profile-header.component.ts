import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';
import { UserService } from '../../../core/services/user.service';
import { ChatService } from '../../../core/services/chat.service';
import { FriendService } from '../../../core/services/friend.service';
import { Friend } from '../../../core/interfaces/friend.model';
import { Game } from '../../../core/interfaces/game.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css',
})
export class ProfileHeaderComponent implements OnInit {
  showFullDescription = false;
  @Input() user!: User | null; // input from mother component
  @Input() isOwnProfile: boolean = false; //isOwnProfile check from mothercomponent
  @Input() isFriend: boolean = false; //isFriend check from mothercomponent
  @Input() completeGames: Game[] = [];
  @Input() genrePopularity: any[] = [];

  constructor(
    private userStore: UserStore,
    private chatService: ChatService,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {}

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  onEditProfile(): void {
    // TODO: Navigate to edit profile or open edit modal
    console.log('Edit profile clicked');
  }

  onUploadPhoto(): void {
    // TODO: Open file picker for profile picture
    console.log('Upload photo clicked');
  }

  ngOnDestroy() {
    this.user = null;
  }

  // when called start chat
  userClicked(userId: any) {
    if (!userId) return;
    this.chatService.startChat([userId]);
  }

  // method to add friend
  addFriend(user: any) {
    if (!user) return;

    this.friendService.sendFriendRequest(user.UserId).subscribe({
      next: (res) => {
        console.log('Friend request sent:', res);
        alert(`Friend request sent to ${user.Username}`);
      },
      error: (err) => {
        console.error('Error sending friend request', err);
        alert('Failed to send friend request');
      },
    });
  }
}
