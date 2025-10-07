import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Game } from '../../../core/interfaces/game.model';
import { GameService } from '../../../core/services/game.service';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-games',
  imports: [FormsModule, ButtonComponent, CommonModule],
  templateUrl: './games.component.html',
  styleUrl: './games.component.css',
})
export class GamesComponent implements OnInit {
  games: Game[] = [];
  sortedGames: Game[] = [];
  selectedGames: Game[] = []; // keep track of selected games
  userId: string = '';
  updatedData: any = {};
  me: any = {};

  @Input() profile: any; // this contains profile data from previous modals
  constructor(
    private modalRef: NgbActiveModal,
    private gameService: GameService,
    private userService: UserService
  ) {}

  // Loads the games to the modal on init
  ngOnInit() {
    this.loadgames();
    console.log(this.profile);
  }
  finish() {
    // First, get the current user
    this.userService.getMe().subscribe({
      next: (res) => {
        this.me = res;
        console.log('me:', this.me);

        const updatedData = {
          username: this.profile.Username,
          languages: this.profile.Languages,
          birthday: this.profile.Birthday,
        };

        // Update username, languages, birthday
        this.userService.updateUser(this.me.UserId, updatedData).subscribe({
          next: (res) => console.log('User updated:', res),
          error: (err) => console.error('Failed to update user:', err),
        });

        // For each selected game, call the Lambda
        const requests = this.selectedGames.map((game) => {
          const gameId = game.PK.split('#')[1];
          return this.gameService.addGame(gameId, game.Name!);
        });

        // Execute all requests in parallel
        forkJoin(requests).subscribe({
          next: (results) => {
            console.log('All games updated:', results);
            // Close modal after success
            this.modalRef.close(this.profile);
          },
          error: (err) => {
            console.error('Failed to update some games:', err);
          },
        });
      },
      error: (err) => console.error('Failed to load user info', err),
    });
    this.modalRef.close();
  }
  back() {
    this.modalRef.dismiss('back');
  }

  loadgames() {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = res;
        console.log('games:', res);
        //sorts games by popularity
        this.sortedGames = [...this.games]
          .filter((game) => Number(game.Popularity) >= 1) // exclude unpopular games
          .sort((a, b) => Number(b.Popularity) - Number(a.Popularity));
        console.log(this.sortedGames);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }
  // Info of the user who is currently logged in
  loadMe() {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.me = res;
        console.log('me:', res);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }

  // Fired when games are selected from the modal
  toggleGameSelection(game: Game) {
    const index = this.selectedGames.findIndex((g) => g.Name === game.Name);
    if (index >= 0) {
      // Game already selected -> remove it
      this.selectedGames.splice(index, 1);
    } else {
      // Game not selected -> add it
      this.selectedGames.push(game);
    }

    console.log(this.selectedGames);
  }

  isSelected(game: Game): boolean {
    return this.selectedGames.some((g) => g.Name === game.Name);
  }
}
