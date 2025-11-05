import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-messages-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './messages-tab.component.html',
  styleUrl: './messages-tab.component.css',
})
export class MessagesTabComponent {
  directChats = input<any[]>([]);
  groupChats = input<any[]>([]);

  activeTab: 'users' | 'groups' = 'users';

  constructor(private chatService: ChatService) {}

  userClicked(userId: any) {
    this.chatService.startChat([userId]);
  }
}
