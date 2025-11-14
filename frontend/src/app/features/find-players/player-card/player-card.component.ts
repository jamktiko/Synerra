import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/interfaces/user.model';
import { FriendService } from '../../../core/services/friend.service';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';
import { UserStore } from '../../../core/stores/user.store';
import { NgbNavItem } from '../../../../../node_modules/@ng-bootstrap/ng-bootstrap/nav/nav';
import { FriendRequest } from '../../../core/interfaces/friendrequest.model';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css'],
})
export class PlayerCardComponent implements OnInit {
  @Input() user!: User;
  @Input() friends!: User[];
  @Input() sentRequests: string[] = [];
  currentUser: User | null = null;
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
    private router: Router,
    private userStore: UserStore
  ) {}

  ngOnInit() {
    this.currentUser = this.userStore.user();
  }

  dropdownOpen = false;

  get isFriend(): boolean {
    if (!this.user || !this.friends) return false;
    return this.friends.some((f) => f.UserId === this.user.UserId);
  }
  get alreadySent(): boolean {
    return !!this.user?.UserId && this.sentRequests.includes(this.user.UserId);
  }

  getCommonLanguages(userLanguages?: string[]): string[] {
    // If either array is missing, return empty
    if (!this.currentUser?.Languages || !userLanguages) return [];

    // Filter only the common languages
    return userLanguages.filter((lang) =>
      this.currentUser!.Languages?.includes(lang)
    );
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
    this.router.navigate([`dashboard/profile/${this.user.UserId}`]);
  }

  SendMsg(userId: any) {
    this.chatService.startChat([userId]);
  }

  onAddFriend() {
    const userId = this.user?.UserId;
    const senderId = this.currentUser?.UserId;

    if (!userId || !senderId) return;

    if (this.alreadySent) return; // already sent, do nothing

    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => {
        alert(`Friend request sent to ${this.user?.Username}`);
        this.sentRequests.push(userId);
      },
      error: (err) => {
        console.error('Failed to send friend request', err);
        alert('Failed to send friend request');
      },
    });
  }
}
