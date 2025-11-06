import {
  Component,
  effect,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {
  games: Game[] = [];
  sortedGames: Game[] = [];
  filteredGames: Game[] = [];
  userGames: any[] = [];
  me: User | null = null;
  greeting: string = '';

  @ViewChild('favRow', { static: false }) favRow?: ElementRef<HTMLElement>;
  @ViewChild('popRow', { static: false }) popRow?: ElementRef<HTMLElement>;

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

  // Scroll helpers for the horizontal games rows. Accepts the native element from template ref.
  scrollRowLeft(row: HTMLElement | null) {
    this.scrollRowBy(row, -1);
  }

  scrollRowRight(row: HTMLElement | null) {
    this.scrollRowBy(row, 1);
  }

  //calls functions on init
  ngOnInit() {
    this.setGreeting();
    this.loadgames();
  }

  ngAfterViewInit(): void {
    // Ensure rows start scrolled to the left. Delay slightly to allow content to render.
    setTimeout(() => this.resetRows(), 60);
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
    // If the view exists, ensure favorite row is scrolled to start when the filtered list updates
    setTimeout(() => this.resetRows(), 0);
  }

  private resetRows() {
    try {
      if (this.favRow && this.favRow.nativeElement) {
        this.favRow.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
      }
      if (this.popRow && this.popRow.nativeElement) {
        this.popRow.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
      }
    } catch (e) {
      // defensive: ignore if DOM not ready
      console.debug('resetRows failed', e);
    }
  }

  private scrollRowBy(row: HTMLElement | null, direction: -1 | 1) {
    if (!row) return;
    try {
      const container = row;
      const firstCard = container.querySelector<HTMLElement>(
        'app-dashboard-card'
      );

      let step = container.clientWidth * 0.85;

      if (firstCard) {
        const cardRect = firstCard.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardStyles = window.getComputedStyle(firstCard);
        const gapStyles = window.getComputedStyle(container);
        const marginLeft = parseFloat(cardStyles.marginLeft || '0') || 0;
        const marginRight = parseFloat(cardStyles.marginRight || '0') || 0;
        const gap =
          parseFloat(gapStyles.columnGap || gapStyles.gap || '0') || 0;
        step = cardWidth + marginLeft + marginRight + gap;
      }

      const maxScroll = container.scrollWidth - container.clientWidth;
      const next =
        direction === 1
          ? Math.min(container.scrollLeft + step, maxScroll)
          : Math.max(container.scrollLeft - step, 0);

      container.scrollTo({ left: next, behavior: 'smooth' });
    } catch (e) {
      console.debug('scrollRowBy failed', e);
    }
  }
}
