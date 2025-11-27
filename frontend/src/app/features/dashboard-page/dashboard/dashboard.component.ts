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
import { UserService } from '../../../core/services/user.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardCardComponent,
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
  ],
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
  loadingSpinnerShowing = true;

  @ViewChild('favRow', { static: false }) favRow?: ElementRef<HTMLElement>;
  @ViewChild('popRow', { static: false }) popRow?: ElementRef<HTMLElement>;

  constructor(
    private gameService: GameService,
    private userStore: UserStore,
    private userService: UserService,
  ) {
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.me = user;
        this.userGames = this.me.PlayedGames || [];
        this.filterUserGames();
      }
    });
  }

  ngOnInit() {
    this.setGreeting();
    this.loadgames();
  }

  // 🔥🔥 ADD DRAG-TO-SCROLL HERE 🔥🔥
  ngAfterViewInit(): void {
    // Existing code
    setTimeout(() => this.resetRows(), 60);

    // Enable desktop drag scrolling
    if (this.favRow?.nativeElement) {
      this.enableDragScroll(this.favRow.nativeElement);
    }
    if (this.popRow?.nativeElement) {
      this.enableDragScroll(this.popRow.nativeElement);
    }
  }

  // 🔥🔥 DRAG-TO-SCROLL LOGIC 🔥🔥
  private enableDragScroll(el: HTMLElement) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.classList.add('dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    el.addEventListener('mouseleave', () => {
      isDown = false;
      el.classList.remove('dragging');
    });

    el.addEventListener('mouseup', () => {
      isDown = false;
      el.classList.remove('dragging');
    });

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    });
  }
  // 🔥 END OF ADDED CODE 🔥

  setGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) this.greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) this.greeting = 'Good afternoon';
    else if (hour >= 17 && hour < 21) this.greeting = 'Good evening';
    else this.greeting = 'Good night';
  }

  loadgames() {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = res;
        this.sortedGames = [...this.games]
          .filter((game) => Number(game.Popularity) >= 1)
          .sort((a, b) => Number(b.Popularity) - Number(a.Popularity));

        this.filterUserGames();
        this.loadingSpinnerShowing = false;
      },
      error: (err) => console.error('Failed to load games', err),
    });
  }

  filterUserGames() {
    const userGameIds = new Set(this.userGames.map((g) => g.gameId));
    this.filteredGames = this.sortedGames.filter((game) =>
      userGameIds.has(game.PK.replace(/^GAME#/, '')),
    );
    this.filteredGames.sort((a, b) => b.Popularity - a.Popularity);

    setTimeout(() => this.resetRows(), 0);
  }

  private resetRows() {
    try {
      this.favRow?.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
      this.popRow?.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
    } catch {}
  }

  scrollRowLeft(row: HTMLElement | null) {
    this.scrollRowBy(row, -1);
  }
  scrollRowRight(row: HTMLElement | null) {
    this.scrollRowBy(row, 1);
  }

  private scrollRowBy(row: HTMLElement | null, direction: -1 | 1) {
    if (!row) return;
    try {
      const container = row;
      const firstCard =
        container.querySelector<HTMLElement>('app-dashboard-card');

      let step = container.clientWidth * 0.85;

      if (firstCard) {
        const cardRect = firstCard.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardStyles = window.getComputedStyle(firstCard);
        const marginLeft = parseFloat(cardStyles.marginLeft || '0') || 0;
        const marginRight = parseFloat(cardStyles.marginRight || '0') || 0;
        const gapStyles = window.getComputedStyle(container);
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
    } catch (e) {}
  }
}
