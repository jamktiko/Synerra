import { Component, OnInit } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { CommonModule } from '@angular/common';
import { Game } from '../../core/interfaces/game.model'; // add if you have a model
import { GameCardComponent } from './game-card/game-card.component';
import { GameFiltersComponent } from './game-filters/game-filters.component';

@Component({
  selector: 'app-choose-game-page',
  imports: [CommonModule, GameCardComponent, GameFiltersComponent],
  templateUrl: './choose-game-page.component.html',
  styleUrl: './choose-game-page.component.css',
})
export class ChooseGamePageComponent implements OnInit {
  games: Game[] = [];
  filteredGames: Game[] = [];
  descending = true;

  // For search input from child component
  searchText: string = '';

  // For selected genre
  selectedGenre: string = '';

  constructor(private gameService: GameService) {}

  // calls the function on init
  ngOnInit() {
    this.loadgames();
  }

  ngOnDestroy() {
    this.games = [];
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

  // when the filters are changed set the selected genre, search and sort
  onFilterChanged(filters: { genre: string; search: string }) {
    this.selectedGenre = filters.genre; // genre filter
    this.searchText = filters.search; // search filter
    this.applyFiltersAndSort(); // apply combined filters
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

    // Genre filter
    if (this.selectedGenre) {
      result = result.filter(
        (game) => game.Genre?.toLowerCase() === this.selectedGenre.toLowerCase()
      );
    }

    // Search filter (begins-with, lowercase)
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      result = result.filter(
        (game) => game.Name?.toLowerCase().startsWith(searchLower) ?? false
      ); // safely handle undefined Name
    }

    // Then sort by popularity
    result.sort((a, b) =>
      this.descending
        ? (b.Popularity ?? 0) - (a.Popularity ?? 0)
        : (a.Popularity ?? 0) - (b.Popularity ?? 0)
    );

    this.filteredGames = result;
    console.log('Filtered & sorted games:', this.filteredGames);
  }
}
