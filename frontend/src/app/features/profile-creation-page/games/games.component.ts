import { Component, effect, Input, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Game } from '../../../core/interfaces/game.model';
import { GameService } from '../../../core/services/game.service';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';
import { HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingPageStore } from '../../../core/stores/loadingPage.store';

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
  user: any = {};
  @Input() profile: any; // this contains profile data from previous modals
  constructor(
    private modalRef: NgbActiveModal,
    private gameService: GameService,
    private userService: UserService,
    private userStore: UserStore,
    private loadingPageStore: LoadingPageStore,
    private router: Router,
  ) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      console.log(
        'TÄMÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ',
        this.user,
      );
      if (user) {
        this.user = user;
      }
    });
  }

  // Loads the games to the modal on init
  ngOnInit() {
    this.loadgames();
    console.log(this.profile);
  }
  finish() {
    // First, get the current user

    const updatedData = {
      username: this.profile.Username,
      languages: this.profile.Languages,
      birthday: this.profile.Birthday,
    };

    if (!this.user) {
      console.error('User not found in store');
      return;
    }

    // Update username, languages, birthday
    this.userService.updateUser(this.user.UserId, updatedData).subscribe({
      next: (res) => {
        console.log('User updated:', res);
        this.userStore.setUser(res);
        this.modalRef.close(this.profile);
        this.router.navigate(['/dashboard']);
        this.modalRef.dismiss();
        this.loadingPageStore.setAuthLayoutLoadingPageVisible(true);
      },
      error: (err) => console.error('Failed to update user:', err),
    });

    // For each selected game, call the Lambda
    const requests = this.selectedGames.map((game) => {
      const gameId = game.PK.split('#')[1];
      return this.gameService.addGame(gameId, game.Name!);
    });
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

  @ViewChild('nextBtn', { read: ElementRef }) nextBtn!: ElementRef;

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    if (this.nextBtn?.nativeElement) {
      this.nextBtn.nativeElement.click();
    }
  }
}
