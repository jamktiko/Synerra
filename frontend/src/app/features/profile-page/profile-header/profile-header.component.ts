import { Component, Input, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';
import { UserService } from '../../../core/services/user.service';
import { ChatService } from '../../../core/services/chat.service';
import { FriendService } from '../../../core/services/friend.service';
import { Friend } from '../../../core/interfaces/friend.model';
import { Game } from '../../../core/interfaces/game.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ReputationService } from '../../../core/services/reputation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
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
  showReputationModal = false;
  sentRequests: string[] = [];
  confirmingRemoval: string | null = null;

  repComms = 50;
  repMentality = 50;
  repTeamwork = 50;

  constructor(
    private userStore: UserStore,
    private chatService: ChatService,
    private friendService: FriendService,
    private reputationService: ReputationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.user) {
      this.friendService.getOutgoingPendingRequests().subscribe({
        next: (requests) => {
          // Keep only receiver IDs with status PENDING
          this.sentRequests = requests
            .filter((r: any) => r.Status === 'PENDING')
            .map((r: any) => r.SK.replace('FRIEND_REQUEST#', ''));
        },
        error: (err) => console.error('Failed to fetch sent requests', err),
      });
    }
  }

  get alreadySent(): boolean {
    return !!this.user?.UserId && this.sentRequests.includes(this.user.UserId);
  }
  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  onEditProfile(): void {
    // TODO: Navigate to edit profile or open edit modal
    console.log('Edit profile clicked');
    this.router.navigate(['/dashboard/settings/profile']);
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
        this.sentRequests.push(user.UserId);
      },
      error: (err) => {
        console.error('Error sending friend request', err);
        alert('Failed to send friend request');
      },
    });
  }

  //method to remove friend
  removeFriend(user: any) {
    if (!user) return;

    // first click → ask confirmation
    if (this.confirmingRemoval !== user.UserId) {
      this.confirmingRemoval = user.UserId;
      return;
    }

    // second click → actually delete
    this.friendService.deleteFriend(user.UserId).subscribe({
      next: (res) => {
        console.log('Friend removed', res);
        alert(`${user.Username} removed from friends`);

        this.sentRequests = this.sentRequests.filter(
          (id) => id !== user.UserId
        );
        this.isFriend = false;
        this.confirmingRemoval = null;
      },
      error: (err) => {
        console.error('Error removing friend', err);
        alert('Failed to remove friend');
        this.confirmingRemoval = null;
      },
    });
  }

  //open modal
  openReputationModal(): void {
    this.showReputationModal = true;
  }

  //close modal
  closeReputationModal(): void {
    this.showReputationModal = false;
  }

  //submit reputation with service method
  submitReputation() {
    if (!this.user?.UserId) return;
    this.reputationService
      .giveReputation(
        this.user.UserId,
        this.repMentality,
        this.repComms,
        this.repTeamwork
      )
      .subscribe({
        next: () => {
          this.closeReputationModal();
          window.location.reload(); // refresh UI to show new values
        },
        error: (err) => console.error(err),
      });
  }
}
