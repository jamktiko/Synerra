import { Component } from '@angular/core';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ProfileContentComponent } from './profile-content/profile-content.component';
import { OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../core/stores/user.store';
import { FriendService } from '../../core/services/friend.service';
import { Game } from '../../core/interfaces/game.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ProfileHeaderComponent, ProfileContentComponent, CommonModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  userId: string = '';
  user: User = {};
  isOwnProfile: boolean = false;
  isFriend: boolean = false;
  private sub!: Subscription;
  private routeSub!: Subscription;
  completeGames: Game[] = [];
  genrePopularity: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private userStore: UserStore,
    private friendService: FriendService
  ) {}

  ngOnInit(): void {
    // get the user id from the route
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId')!;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.loadUser();
    });

    console.log(this.userId);
  }

  onGamesLoaded(games: Game[]): void {
    this.completeGames = games;
    console.log('Received games from child:', games);
  }

  private loadUser() {
    // Unsubscribe previous user subscription if any
    this.sub?.unsubscribe();

    // compare the logged in user to the user got from the routes to check if they are the same
    this.sub = this.userService.getUserById(this.userId).subscribe({
      next: (res) => {
        this.user = res;
        const currentUser = this.userStore.user();
        this.isOwnProfile = currentUser?.UserId === this.user?.UserId;

        this.checkFriendship();
      },
      error: (err) => console.error('Failed to load user:', err),
    });
  }

  // checks if the user from the routes is your friend
  private checkFriendship() {
    if (!this.user) return;

    this.friendService.getFriends().subscribe({
      next: (friends) => {
        // Set flag if the viewed user is in the friends list
        this.isFriend = friends.some((f) => f.UserId === this.user?.UserId);
        console.log(this.isFriend);
      },
      error: (err) => console.error('Failed to load friends:', err),
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe(); // cleanup subscription
  }
}
