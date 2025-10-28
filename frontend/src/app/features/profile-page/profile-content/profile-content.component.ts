import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';
import { Game } from '../../../core/interfaces/game.model';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-content.component.html',
  styleUrl: './profile-content.component.css',
})
export class ProfileContentComponent implements OnInit {
  user: User | null = null;

  // Placeholder data - will be replaced with real data from services
  userGames: Game[] = [];
  chatrooms: any[] = [];

  // Reputation/stats data
  stats = {
    languages: ['English', 'Finnish', 'Swedish'],
    playstyle: 'Competitive',
    genres: ['FPS', 'MOBA', 'RPG'],
    platforms: ['PC', 'PlayStation'],
    comms: 75,
    mentality: 85,
    teamwork: 90,
    overall: 80,
  };

  constructor(private userStore: UserStore) {}

  ngOnInit(): void {
    this.user = this.userStore.user();
    // TODO: Load user's games from service
    // TODO: Load chatrooms from service
  }

  onRemoveGame(gameId: string): void {
    console.log('Remove game:', gameId);
    // TODO: Implement game removal
  }
}
