import { CommonModule } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface User {
  name: string;
  avatar: string;
  lastMessage: string;
}

@Component({
  standalone: true,
  selector: 'app-social-menu',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './social-menu.component.html',
  styleUrl: './social-menu.component.css',
})
export class SocialMenuComponent {
  messagesTabShowing = input<boolean>();
  notificationsClicked = output<string>();

  switchTab(tab: string) {
    this.notificationsClicked.emit(tab);
  }
}
