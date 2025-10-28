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
  availableLanguages = [
    { value: 'en', flag: 'https://flagcdn.com/gb.svg' },
    { value: 'es', flag: 'https://flagcdn.com/es.svg' },
    { value: 'fr', flag: 'https://flagcdn.com/fr.svg' },
    { value: 'de', flag: 'https://flagcdn.com/de.svg' },
    { value: 'zh', flag: 'https://flagcdn.com/cn.svg' },
    { value: 'hi', flag: 'https://flagcdn.com/in.svg' },
    { value: 'ar', flag: 'https://flagcdn.com/sa.svg' },
    { value: 'pt', flag: 'https://flagcdn.com/pt.svg' },
    { value: 'ru', flag: 'https://flagcdn.com/ru.svg' },
    { value: 'ja', flag: 'https://flagcdn.com/jp.svg' },
    { value: 'fi', flag: 'https://flagcdn.com/fi.svg' },
    { value: 'sv', flag: 'https://flagcdn.com/se.svg' },
  ];

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private router: Router
  ) {}

  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  get userLanguages(): string[] {
    return this.user?.Languages ?? [];
  }

  getFlag(code: string): string {
    const lang = this.availableLanguages.find((l) => l.value === code);
    return lang ? lang.flag : '';
  }
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
