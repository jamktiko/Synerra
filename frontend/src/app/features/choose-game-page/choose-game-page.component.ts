import { Component, OnInit } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { CommonModule } from '@angular/common';
import { Game } from '../../core/interfaces/game.model'; // add if you have a model
import { GameCardComponent } from './game-card/game-card.component';
import { GameFiltersComponent } from './game-filters/game-filters.component';
import { SocialBarComponent } from '../social-bar/social-bar.component';

@Component({
  selector: 'app-choose-game-page',
  imports: [
    CommonModule,
    GameCardComponent,
    GameFiltersComponent,
    SocialBarComponent,
  ],
  templateUrl: './choose-game-page.component.html',
  styleUrl: './choose-game-page.component.css',
})
export class ChooseGamePageComponent implements OnInit {
  games: Game[] = [];
  filteredGames: Game[] = [];
  descending = true; // default sort order

  constructor(private gameService: GameService) {}

  // calls the function on init
  ngOnInit() {
    this.loadgames();
  }

  // gets games from endpoint
  loadgames() {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = res;
        this.applyFiltersAndSort(); // initial sort & filter
        console.log('games:', res);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }

  selectedGenre: string = '';

  // when the filters are changed set the selected genre and sort
  onFilterChanged(genre: string) {
    this.selectedGenre = genre;
    this.applyFiltersAndSort();
  }

  //toggles sort order popularity desc/asc
  toggleSortOrder() {
    this.descending = !this.descending;
    this.applyFiltersAndSort();
  }

  //applies both the filters and sorts
  applyFiltersAndSort() {
    // Filter first
    let result = [...this.games];
    if (this.selectedGenre) {
      result = result.filter(
        (game) => game.Genre?.toLowerCase() === this.selectedGenre.toLowerCase()
      );
    }

    // Then sort
    result.sort((a, b) =>
      this.descending
        ? b.Popularity - a.Popularity
        : a.Popularity - b.Popularity
    );

    this.filteredGames = result;
    console.log('Filtered & sorted games:', this.filteredGames);
  }
}
