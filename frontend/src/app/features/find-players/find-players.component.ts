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
import { FriendRequest } from '../../core/interfaces/friendrequest.model';
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
  sentRequests: string[] = [];
  comingRequests: string[] = [];
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

    this.friendService.getOutgoingPendingRequests().subscribe({
      next: (requests) => {
        // Keep only receiver IDs with status PENDING
        this.sentRequests = requests
          .filter((r: any) => r.Status === 'PENDING')
          .map((r: any) => r.SK.replace('FRIEND_REQUEST#', ''));
      },
      error: (err) => console.error('Failed to fetch sent requests', err),
    });

    this.friendService.pendingRequests$.subscribe({
      next: (requests: FriendRequest[]) => {
        // Keep only sender IDs with status PENDING
        this.comingRequests = requests
          .filter((r) => r.Status === 'PENDING')
          .map((r) => r.SenderId); // SenderId is the user who sent the request
        console.log('INCOMING IDs:', this.comingRequests);
      },
      error: (err) => console.error('Failed to load pending requests', err),
    });
  }

  // called when the filters are changed, does the actual filtering
  onFiltersChanged(filters: UserFilters) {
    const { username, Status, languages, games, platform, playstyle } = filters;

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

          // Playstyle filter
          if (playstyle) {
            candidates = candidates.filter((u) => u.Playstyle === playstyle);
          }

          // Platform filter
          if (platform && platform.length > 0) {
            candidates = candidates.filter((u) =>
              u.Platform?.some((p: string) => platform.includes(p))
            );
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
