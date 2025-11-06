import { Component, OnInit } from '@angular/core';
import { SocialMenuComponent } from './social-menu/social-menu.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { UserService } from '../../core/services/user.service';
import { UserStore } from '../../core/stores/user.store';
import { ChatService } from '../../core/services/chat.service';
import { NotificationsTabComponent } from './notifications-tab/notifications-tab.component';
import { MessagesTabComponent } from './messages-tab/messages-tab.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-page',
  imports: [
    CommonModule,
    SocialMenuComponent,
    NotificationsTabComponent,
    MessagesTabComponent,
  ],
  templateUrl: './social-page.component.html',
  styleUrl: './social-page.component.css',
})
export class SocialPageComponent implements OnInit {
  messagesTabShowing: boolean = true;

  directChats: any[] = [];
  groupChats: any[] = [];
  noChats: boolean = false;

  constructor(
    private userService: UserService,
    private userStore: UserStore,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    const loggedInUser = this.userStore.getUser();
    if (loggedInUser?.UserId) {
      this.userService.getUserRooms(loggedInUser.UserId).subscribe({
        next: (res) => {
          const allChatRooms = res.rooms;
          console.log(allChatRooms);

          for (let room of allChatRooms) {
            // remove logged-in user from members
            room.Members = room.Members.filter(
              (m: any) => m.UserId !== loggedInUser.UserId,
            );

            if (room.Members.length === 1) {
              this.directChats.push(room);
            } else if (room.Members.length > 1) {
              this.groupChats.push(room);
            } else {
              this.noChats = true;
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

  tabSwitch(tab: string) {
    if (tab === 'notifications') {
      this.messagesTabShowing = false;
    } else if (tab === 'messages') {
      this.messagesTabShowing = true;
    }
  }
}
