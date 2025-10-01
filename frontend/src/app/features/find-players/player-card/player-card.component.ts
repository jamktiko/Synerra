import { Component, Input } from '@angular/core';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css'],
})
export class PlayerCardComponent {
  @Input() user!: User;

  isFavorite: boolean = false;

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.isFavorite = !this.isFavorite;
  }

  onInvite(): void {
    console.log(`Send message to ${this.user.Username}`);
  }

  onProfile(): void {
    console.log(`Opening profile of ${this.user.Username}`);
  }

  onAddFriend(): void {
    console.log(`Friend request sent to ${this.user.Username}`);
  }
}
