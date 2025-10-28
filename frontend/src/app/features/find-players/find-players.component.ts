import { Component, effect, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { User, UserFilters } from '../../core/interfaces/user.model';
import { PlayerCardComponent } from './player-card/player-card.component';
import { PlayerFiltersComponent } from './player-filters/player-filters.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UserStore } from '../../core/stores/user.store';
import { BehaviorSubject, combineLatest } from 'rxjs';
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
  users$: Observable<User[]>;
  onlineUsers$: Observable<User[]>;
  filteredUsers$ = new BehaviorSubject<User[]>([]);

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

    // base users stream
    this.users$ = this.userService.users$;
    this.onlineUsers$ = this.users$.pipe(
      map((users) => users.filter((user) => user.Status === 'online'))
    );
    this.users$.subscribe((users) => {
      this.filteredUsers$.next(users);
    });
  }

  ngOnInit() {
    this.userService.refreshUsers();

    this.users$.subscribe((users) => {
      console.log('Reactive users:', users);
    });

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
        Status: '',
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

  // called when the filters are changed, does the actual filtering
  onFiltersChanged(filters: UserFilters) {
    const { username, Status, languages, games } = filters;

    // Take latest users from users$ and filter
    this.users$
      .pipe(
        map((users) => {
          let candidates = [...users];

          // username filter
          if (username) {
            candidates = candidates.filter((u) =>
              u.Username_Lower?.includes(username.toLowerCase())
            );
          }

          //language filter
          if (languages && languages.length > 0) {
            candidates = candidates.filter((u) =>
              u.Languages?.some((lang) => languages.includes(lang))
            );
          }

          //game filter
          if (games && games.length > 0) {
            candidates = candidates.filter((u) =>
              u.PlayedGames?.some((pg) => games.includes(pg.gameId))
            );
          }

          //online status filter
          if (Status) {
            candidates = candidates.filter((u) => u.Status === Status);
          }

          // Exclude current user
          if (this.user) {
            candidates = candidates.filter((u) => u.PK !== this.user?.PK);
          }

          return candidates;
        })
      )
      .subscribe((filtered) => {
        // Emit filtered users to the BehaviorSubject
        this.filteredUsers$.next(filtered);
      });
  }
}
