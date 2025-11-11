import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';
import { Game } from '../../../core/interfaces/game.model';
import { GameService } from '../../../core/services/game.service';
import { forkJoin, Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-profile-content',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './profile-content.component.html',
  styleUrl: './profile-content.component.css',
})
export class ProfileContentComponent implements OnInit {
  @Input() user!: User | null; // user from mother component
  @Input() isOwnProfile: boolean = false; //isOwnProfile check from mothercomponent
  @Input() isFriend: boolean = false; //isFriend check from mothercomponent
  @Output() gamesLoaded = new EventEmitter<Game[]>();
  // Placeholder data - will be replaced with real data from services
  userGames: Game[] = [];
  chatrooms: any[] = [];
  completeGames: Game[] = [];
  genrePopularity: any[] = [];
  private sub!: Subscription;

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

  // to get the language names and flags
  availableLanguages = [
    { value: 'en', name: 'English', flag: 'https://flagcdn.com/gb.svg' },
    { value: 'es', name: 'Spanish', flag: 'https://flagcdn.com/es.svg' },
    { value: 'fr', name: 'French', flag: 'https://flagcdn.com/fr.svg' },
    { value: 'de', name: 'German', flag: 'https://flagcdn.com/de.svg' },
    { value: 'zh', name: 'Chinese', flag: 'https://flagcdn.com/cn.svg' },
    { value: 'hi', name: 'Hindi', flag: 'https://flagcdn.com/in.svg' },
    { value: 'ar', name: 'Arabic', flag: 'https://flagcdn.com/sa.svg' },
    { value: 'pt', name: 'Portuguese', flag: 'https://flagcdn.com/pt.svg' },
    { value: 'ru', name: 'Russian', flag: 'https://flagcdn.com/ru.svg' },
    { value: 'ja', name: 'Japanese', flag: 'https://flagcdn.com/jp.svg' },
    { value: 'fi', name: 'Finnish', flag: 'https://flagcdn.com/fi.svg' },
    { value: 'sv', name: 'Swedish', flag: 'https://flagcdn.com/se.svg' },
  ];
  constructor(private userStore: UserStore, private gameService: GameService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']) {
      if (this.sub) this.sub.unsubscribe(); // cancel previous fetch

      this.completeGames = [];

      if (this.user?.PlayedGames?.length) {
        this.loadGames();
      }
    }
  }
  ngOnInit(): void {}

  // helper function to get language names
  getLanguageNames(codes: string[] | undefined): string {
    if (!codes?.length) return '';
    return codes
      .map(
        (code) =>
          this.availableLanguages.find((lang) => lang.value === code)?.name ||
          code
      )
      .join(', ');
  }
  // gets the users favourite games
  private loadGames(): void {
    const playedGames = this.user?.PlayedGames ?? [];
    if (!playedGames.length) return;

    this.sub = this.gameService.listGames().subscribe({
      next: (allGames: any[]) => {
        // Map user games to full game objects
        this.completeGames = playedGames
          .map((userGame) =>
            allGames.find(
              (g) => g.Name_lower === userGame.gameName.toLowerCase()
            )
          )
          .filter(Boolean); // remove any unmatched games

        // Calculate genre popularity
        const genreCountMap: Record<string, number> = {};
        this.completeGames.forEach((game) => {
          const genre = game.Genre?.toLowerCase() || 'unknown';
          genreCountMap[genre] = (genreCountMap[genre] || 0) + 1;
        });

        this.genrePopularity = Object.entries(genreCountMap)
          .sort((a, b) => b[1] - a[1])
          .map(([genre]) => genre.charAt(0).toUpperCase() + genre.slice(1));

        this.gamesLoaded.emit(this.completeGames);
        console.log('Complete games after fetch:', this.completeGames);
      },
      error: (err) => console.error('Failed to fetch all games:', err),
    });
  }

  onRemoveGame(pk: string): void {
    const gameId = pk.replace('GAME#', '');
    console.log('DELETING GAME: ', gameId);

    this.gameService.removeGame(gameId).subscribe({
      next: (res) => {
        console.log('Game removed successfully:', res);

        // Update local arrays
        this.completeGames = this.completeGames.filter((g) => g.PK !== pk);

        if (this.user?.PlayedGames) {
          this.user.PlayedGames = this.user.PlayedGames.filter(
            (g: any) => g.PK !== pk && g.gameId !== gameId
          );
        }

        // Push updated user into the signal store
        if (this.user) {
          this.userStore.updateLocalUser(this.user);
        }
      },
      error: (err) => {
        console.error('Failed to remove game:', err);
      },
    });
  }

  ngOnDestroy() {
    this.user = null;
    this.completeGames = [];
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
