import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css'],
})
export class PlayerCardComponent {
  @Input() user!: User;

  onProfile(): void {
    console.log(`Opening profile of ${this.user.Username}`);
  }

  onInvite(): void {
    console.log(`Send message to ${this.user.Username}`);
  }

  onAddFriend(): void {
    console.log(`Friend request sent to ${this.user.Username}`);
  }
}
