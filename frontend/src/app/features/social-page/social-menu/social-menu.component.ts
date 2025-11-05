import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { UserService } from '../../../core/services/user.service';
import { UserStore } from '../../../core/stores/user.store';

interface User {
  name: string;
  avatar: string;
  lastMessage: string;
}

@Component({
  selector: 'app-social-menu',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './social-menu.component.html',
  styleUrl: './social-menu.component.css',
})
export class SocialMenuComponent implements OnInit {
  activeTab: 'users' | 'groups' = 'users';

  directChats: any[] = [];
  groupChats: any[] = [];

  constructor(
    private userService: UserService,
    private userStore: UserStore,
  ) {}

  ngOnInit(): void {
    const loggedInUser = this.userStore.getUser();
    if (loggedInUser?.UserId) {
      this.userService.getUserRooms(loggedInUser.UserId).subscribe({
        next: (res) => {
          const allChatRooms = res.rooms;
          console.log(allChatRooms);
          for (let i of allChatRooms) {
            if (i.Members.length === 2) {
              console.log('pushiings', i);
              this.directChats.push(i);
            } else if (i.Members.length > 2) {
              this.groupChats.push(i);
            }
          }
        },
        error: (err) => {
          console.error('Failed to fetch rooms:', err);
        },
      });
    } else {
      console.error('No userId found');
    }
  }
}
