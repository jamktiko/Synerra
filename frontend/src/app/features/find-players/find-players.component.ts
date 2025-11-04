import { Component, effect, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { User, UserFilters } from '../../core/interfaces/user.model';
import { PlayerCardComponent } from './player-card/player-card.component';
import { PlayerFiltersComponent } from './player-filters/player-filters.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserStore } from '../../core/stores/user.store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { FriendService } from '../../core/services/friend.service';
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
  friends: User[] = [];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private userStore: UserStore,
    private friendService: FriendService
  ) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.user = user;
      }
    });

    // base users stream, filter out logged in user
    this.users$ = this.userService.users$.pipe(
      map((users) => {
        if (!this.user) return users;
        return users.filter((u) => u.PK !== this.user?.PK);
      })
    );
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

      // Build a plain filter object that matches what tests expect (no extra keys)
      const initialGameFilter: any = {
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

    this.friendService.getFriends().subscribe({
      next: (users) => {
        this.friends = users;
      },
      error: (err) => {
        console.error('Failed to fetch friends', err);
      },
    });
  }

  // called when the filters are changed, does the actual filtering
  onFiltersChanged(filters: UserFilters) {
    const { username, Status, onlineStatus, languages, games } = filters as any;

    // If username is provided, call both username search and filterUsers and intersect results
    if (username && username.trim() !== '') {
      const usernameObs = this.userService
        .getUserByUsername(username)
        .pipe(catchError(() => of({ users: [] })));

      const filterObs = this.userService
        .filterUsers({
          // pass Status if available, but tests expect `onlineStatus` key sometimes
          ...(onlineStatus !== undefined ? { onlineStatus } : {}),
          ...(Status !== undefined ? { Status } : {}),
          ...(languages && languages.length ? { languages } : {}),
          ...(games && games.length ? { games } : {}),
        } as any)
        .pipe(catchError(() => of({ users: [] })));

      forkJoin([usernameObs, filterObs]).subscribe(
        ([usernameRes, filterRes]) => {
          const usernameList = (usernameRes?.users || []).map((u: any) => u.PK);
          let intersected = (filterRes?.users || []).filter((u: any) =>
            usernameList.includes(u.PK)
          );

          if (this.user) {
            intersected = intersected.filter(
              (u: any) => u.PK !== this.user?.PK
            );
          }

          this.users = intersected;
          this.filteredUsers$.next(intersected);
        }
      );
      return;
    }

    // Otherwise call filterUsers API and apply basic client-side filters
    const filterPayload: any = {
      ...(onlineStatus !== undefined ? { onlineStatus } : {}),
      ...(Status !== undefined ? { Status } : {}),
      ...(languages && languages.length ? { languages } : {}),
      ...(games && games.length ? { games } : {}),
    };

    this.userService
      .filterUsers(filterPayload as any)
      .pipe(
        catchError(() => of({ users: [] })),
        map((res: any) => res.users || [])
      )
      .subscribe((users: any[]) => {
        let results = users || [];
        // If games filter is provided as game IDs, ensure PlayedGames contains those IDs
        if (games && games.length > 0) {
          results = results.filter((u: any) =>
            (u.PlayedGames || []).some((pg: any) => games.includes(pg.gameId))
          );
        }

        if (this.user) {
          results = results.filter((u: any) => u.PK !== this.user?.PK);
        }

        this.users = results;
        this.filteredUsers$.next(results);
      });
  }
}
