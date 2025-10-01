import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../core/interfaces/game.model';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-player-filters',
  standalone: true, // if you want to use standalone components
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './player-filters.component.html',
  styleUrls: ['./player-filters.component.css'],
})
export class PlayerFiltersComponent implements OnInit {
  games: Game[] = [];
  showGames = false;
  showLanguages = false;
  filters = {
    username: '',
    languages: [] as string[],
    onlineStatus: '',
    games: [] as string[],
  };
  searchControl = new FormControl('');

  availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'fi', label: 'Finnish' },
    { value: 'sv', label: 'Swedish' },
    { value: 'ru', label: 'Russian' },
  ];

  @Output() filtersChanged = new EventEmitter<any>();

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.loadGames();
    // Watch the search input with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // wait 400ms after typing stops
        distinctUntilChanged() // only trigger if value changed
      )
      .subscribe((username) => {
        this.filters.username = username ?? '';
        this.onFilterChange();
      });
  }

  onFilterChange() {
    this.filtersChanged.emit(this.filters); // emit current filters up to parent
  }

  loadGames() {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = res; // assuming backend returns { games: [...] }

        console.log('Games loaded:', this.games);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }

  onLanguagesChange(event: Event) {
    const selectedOptions = Array.from(
      (event.target as HTMLSelectElement).selectedOptions
    ).map((opt: any) => opt.value);

    this.filters.languages = selectedOptions;
    this.onFilterChange();
  }

  onGamesChange(event: Event) {
    const selectedOptions = Array.from(
      (event.target as HTMLSelectElement).selectedOptions
    ).map((opt) => opt.value);

    this.filters.games = selectedOptions;
    this.onFilterChange();
  }

  onGameToggle(event: Event, gameId: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.filters.games.includes(gameId)) this.filters.games.push(gameId);
    } else {
      this.filters.games = this.filters.games.filter((g) => g !== gameId);
    }
    this.onFilterChange();
  }

  onLanguageToggle(event: Event, lang: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.filters.languages.includes(lang)) {
        this.filters.languages.push(lang);
      }
    } else {
      this.filters.languages = this.filters.languages.filter((l) => l !== lang);
    }
    this.onFilterChange();
  }
}
