import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FriendService } from '../../core/services/friend.service';
import { User } from '../../core/interfaces/user.model';
import { ChatService } from '../../core/services/chat.service';
import { Observable } from 'rxjs';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-social-bar',
  imports: [CommonModule, NotificationsComponent],
  templateUrl: './social-bar.component.html',
  styleUrls: ['./social-bar.component.css', '../../../styles.css'],
})
export class SocialBarComponent {
  users$: Observable<User[]>;

  constructor(
    private friendService: FriendService,
    private chatService: ChatService
  ) {
    this.users$ = this.friendService.friends$;
  }

  ngOnInit() {
    // Subscribe first to catch updates
    this.friendService.friends$.subscribe((friends) => {
      console.log('Reactive friends:', friends);
    });

    // Trigger initial fetch after subscription
    this.friendService.getFriends().subscribe({
      next: (res) => console.log('Initial fetch complete', res),
      error: (err) => console.error(err),
    });
    console.log(this.users$);
  }

  //VANHA LOAD USERS
  // loadUsers() {
  //   this.friendService.getFriends().subscribe({
  //     next: (res) => {
  //       this.users = res.users;
  //       console.log('Users:', res.users);
  //     },
  //     error: (err) => {
  //       console.error('Failed to load users', err);
  //     },
  //   });
  // }

  userClicked(userId: any) {
    this.chatService.startChat([userId]);
  }
}
