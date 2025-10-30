import { Component, effect } from '@angular/core';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../core/interfaces/game.model';
import { OnInit } from '@angular/core';
import { DashboardCardComponent } from './dashboard-card/dashboard-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../core/interfaces/user.model';
import { UserStore } from '../../../core/stores/user.store';
import { ChatService } from '../../../core/services/chat.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  imports: [DashboardCardComponent, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  games: Game[] = [];
  sortedGames: Game[] = [];
  filteredGames: Game[] = [];
  userGames: any[] = [];
  me: User | null = null;
  greeting: string = '';

  constructor(
    private gameService: GameService,
    private userStore: UserStore,
    private userService: UserService
  ) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.me = user;
        this.userGames = this.me.PlayedGames || [];
        console.log('Usergames:', this.userGames);
        this.filterUserGames();
      }
    });
  }

  //calls functions on init
  ngOnInit() {
    this.setGreeting();
    this.loadgames();
  }

  setGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      this.greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      this.greeting = 'Good evening';
    } else {
      this.greeting = 'Good night';
    }
  }
  //gets games to the dashboard from endpoint
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
        this.filterUserGames();
        console.log('Users played games:', this.userGames);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }

  // Searches the games that the current user has added as favourites
  filterUserGames() {
    const userGameIds = new Set(this.userGames.map((g) => g.gameId));
    console.log(userGameIds);
    this.filteredGames = this.sortedGames.filter((game) => {
      const gameId = game.PK.replace(/^GAME#/, ''); // remove prefix
      return userGameIds.has(gameId);
    });
    console.log('Filtered games', this.filteredGames);
    // Optional: sort by popularity
    this.filteredGames.sort((a, b) => b.Popularity - a.Popularity);
  }
}
