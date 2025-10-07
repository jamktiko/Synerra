import { Component } from '@angular/core';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../core/interfaces/game.model';
import { OnInit } from '@angular/core';
import { DashboardCardComponent } from './dashboard-card/dashboard-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../core/interfaces/user.model';
import { UserService } from '../../../core/services/user.service';
import { NotificationsComponent } from '../../notifications/notifications.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardCardComponent,
    CommonModule,
    FormsModule,
    NotificationsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  games: Game[] = [];
  sortedGames: Game[] = [];
  filteredGames: Game[] = [];
  userGames: any[] = [];
  me: User[] = [];
  constructor(
    private gameService: GameService,
    private userService: UserService
  ) {}

  //calls functions on init
  ngOnInit() {
    this.loadgames();
    this.loadMe();
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

  //gets info of the user that is currently logged in
  loadMe() {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.me = res;
        console.log('me:', res);
        this.userGames = res.PlayedGames;
        console.log('Usergames:', this.userGames);

        this.filterUserGames();
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

  showNotifications = false;
  unreadCount = 0;

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;

    // Optionally, load unread count when opening
    if (this.showNotifications) {
      this.userService.getUnreadMessages().subscribe({
        next: (messages) => {
          this.unreadCount = messages.length;
        },
        error: (err) => console.error(err),
      });
    }
  }
}
