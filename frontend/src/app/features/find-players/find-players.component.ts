import { Component, effect, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { User, UserFilters } from '../../core/interfaces/user.model';
import { PlayerCardComponent } from './player-card/player-card.component';
import { PlayerFiltersComponent } from './player-filters/player-filters.component';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UserStore } from '../../core/stores/user.store';

@Component({
  selector: 'app-find-players',
  standalone: true,
  imports: [CommonModule, PlayerCardComponent, PlayerFiltersComponent],
  templateUrl: './find-players.component.html',
  styleUrls: ['./find-players.component.css'],
})
export class FindPlayersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  initialGameFilter: any;
  preSelectedGame: string | null = null;
  user: User | null = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private userStore: UserStore
  ) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.user = user;
      }
    });
  }

  ngOnInit() {
    // pass the selected game to make the checkbox selected
    this.route.queryParams.subscribe((params) => {
      const game = params['game'];
      if (game) {
        this.preSelectedGame = game;
      }
    });

    // change the filters per the selected game
    this.route.queryParams.subscribe((params) => {
      const game = params['game'];

      const initialGameFilter: UserFilters = {
        username: '',
        onlineStatus: '',
        languages: [],
        games: [],
      };

      if (game) {
        //  Push the game into the games array
        (initialGameFilter.games ??= []).push(game);
      }

      //  Apply the filters
      this.onFiltersChanged(initialGameFilter);
    });
  }

  // loads user from endpoint
  loadUsers(p0?: any[]) {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.users;
        console.log('Users:', res.users);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
    });
  }

  // called when the filters are changed, does the actual filtering
  onFiltersChanged(filters: UserFilters) {
    const { username, onlineStatus, languages, games } = filters;
    console.log(filters);
    // Request username search + filter endpoint as before
    let usernameRequest$ = username
      ? this.userService
          .getUserByUsername(username)
          .pipe(catchError(() => of({ users: [] })))
      : of({ users: null });

    let filterRequest$ = this.userService
      .filterUsers({ onlineStatus, languages })
      .pipe(catchError(() => of({ users: [] })));

    forkJoin([usernameRequest$, filterRequest$])
      .pipe(
        map(([usernameRes, filterRes]) => {
          let candidates = filterRes.users;

          // If username was provided, intersect with that result
          if (usernameRes.users !== null) {
            const usernameIds = new Set(
              usernameRes.users.map((u: User) => u.PK)
            );
            candidates = candidates.filter((u: User) => usernameIds.has(u.PK));
          }

          // Filter by PlayedGames locally (frontend only)
          if (games && games.length > 0) {
            candidates = candidates.filter((u: User) =>
              u.PlayedGames?.some((pg) => games.includes(pg.gameId))
            );
          }

          return candidates;
        })
      )
      .subscribe({
        next: (combinedUsers) => {
          // Remove the logged-in user
          if (this.user) {
            combinedUsers = combinedUsers.filter(
              (u: User) => u.PK !== this.user?.PK
            );
          }

          this.users = combinedUsers;
        },
        error: (err) => console.error('Error fetching users', err),
      });
  }
}
