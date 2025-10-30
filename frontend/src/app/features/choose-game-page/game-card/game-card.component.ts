import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Game } from '../../../core/interfaces/game.model';
import { Router } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { UserStore } from '../../../core/stores/user.store';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/interfaces/user.model';
@Component({
  selector: 'app-game-card',
  imports: [CommonModule],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent implements OnInit {
  @Input() game!: Game;
  @Output() gameRemoved = new EventEmitter<string>();
  @Output() gameFavourited = new EventEmitter<Game>();
  isFavourite: boolean = false;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private gameService: GameService,
    private userStore: UserStore
  ) {}

  ngOnInit() {
    const gameId = this.game.PK.replace('GAME#', '');
    this.currentUser = this.userStore.user();
    this.refreshFavouriteStatus();
  }
  private refreshFavouriteStatus() {
    const gameId = this.game.PK.replace('GAME#', '');
    this.isFavourite = !!this.currentUser?.PlayedGames?.some(
      (g) => g.gameId === gameId
    );
  }

  selectGame(game: any) {
    this.router.navigate(['dashboard/find-players'], {
      queryParams: { game: game.PK.replace('GAME#', '') },
    });
  }

  // when star-button is clicked check if the game is already favourited and do actions based on that
  toggleFavourite(event: MouseEvent) {
    event.stopPropagation();
    const gameId = this.game.PK.replace('GAME#', '');
    if (this.isFavourite) {
      this.removeFromFavourites(gameId);
      console.log('Game removed', this.game.Name);
    } else {
      this.addToFavourites(this.game);
      console.log('Game added', this.game.Name);
    }
    this.userStore.getUser();
  }

  // adds game to favourites (creates relation between user and game in the database, also adds it to useritem)
  addToFavourites(game: Game) {
    const gameId = game.PK.replace('GAME#', '');
    const gameName = game.Name || '';

    this.gameService.addGame(gameId, gameName).subscribe({
      next: () => {
        // Update local user state immediately
        if (this.currentUser) {
          this.currentUser.PlayedGames = this.currentUser.PlayedGames || [];
          if (!this.currentUser.PlayedGames.some((g) => g.gameId === gameId)) {
            this.currentUser.PlayedGames.push({ gameId, gameName });
          }
        }
        this.refreshFavouriteStatus();
      },
      error: (err) => {
        if (err.status === 409) {
          // Already favourited, just refresh local state
          this.refreshFavouriteStatus();
        } else {
          console.error('Failed to add game:', err);
        }
      },
    });
  }

  //removes game from favourites (removes database user-game relation item, also removes the game from user item)
  removeFromFavourites(gameId: string) {
    this.gameService.removeGame(gameId).subscribe({
      next: () => {
        if (this.currentUser?.PlayedGames) {
          this.currentUser.PlayedGames = this.currentUser.PlayedGames.filter(
            (g) => g.gameId !== gameId
          );
        }
        this.refreshFavouriteStatus();
      },
      error: (err) => console.error('Failed to remove game:', err),
    });
  }
}
