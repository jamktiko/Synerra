import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FriendService } from '../../core/services/friend.service';
import { User } from '../../core/interfaces/user.model';

@Component({
  selector: 'app-social-bar',
  imports: [CommonModule],
  templateUrl: './social-bar.component.html',
  styleUrls: ['./social-bar.component.css', '../../../styles.css'],
})
export class SocialBarComponent {
  users: User[] = [];

  constructor(private friendService: FriendService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.friendService.getFriends().subscribe({
      next: (res) => {
        this.users = res.users;
        console.log('Users:', res.users);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
    });
  }

  userClicked(name: any) {
    console.log(name);
  }
}
