import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { GameService } from '../../../core/services/game.service';
import { Game } from '../../../core/interfaces/game.model';

type DropdownKey = 'languages' | 'games' | 'status';

@Component({
  selector: 'app-player-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './player-filters.component.html',
  styleUrls: ['./player-filters.component.css'],
})
export class PlayerFiltersComponent implements OnInit {
  games: Game[] = [];

  filters = {
    username: '',
    languages: [] as string[],
    onlineStatus: '',
    games: [] as string[],
  };

  searchControl = new FormControl('');
  openDropdown: DropdownKey | null = null;
  // Muuttuja valitun statuksen tekstille
  selectedStatusLabel: string = 'Any status';

  availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ar', label: 'Arabic' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'fi', label: 'Finnish' },
    { value: 'sv', label: 'Swedish' },
  ].sort((a, b) => a.label.localeCompare(b.label));

  @Output() filtersChanged = new EventEmitter<typeof this.filters>();
  @Input() preSelectedGame: string | null = null;
  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.loadGames();
    if (this.preSelectedGame) {
      //  Push the pre-selected game into the filters.games array if not already present
      console.log('PRESELECTED:', this.preSelectedGame);
      if (!this.filters.games) this.filters.games = [];
      if (!this.filters.games.includes(this.preSelectedGame)) {
        this.filters.games.push(this.preSelectedGame);
      }
    }
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((username) => {
        this.filters.username = (username ?? '').trim();
        this.onFilterChange();
      });
  }

  private loadGames(): void {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = Array.isArray(res)
          ? res.sort((a, b) => a.Name.localeCompare(b.Name))
          : [];
      },
      error: (err) => {
        console.error('Failed to load games', err);
        this.games = [];
      },
    });
  }

  onFilterChange(): void {
    this.filtersChanged.emit({ ...this.filters });
  }

  toggleDropdown(type: DropdownKey): void {
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  // PÄIVITETTY: Asettaa myös label-tekstin
  onStatusChange(value: string): void {
    this.filters.onlineStatus = value;
    if (value === 'online') {
      this.selectedStatusLabel = 'Online';
    } else if (value === 'offline') {
      this.selectedStatusLabel = 'Offline';
    } else {
      this.selectedStatusLabel = 'Any status';
    }
    this.onFilterChange();
    this.openDropdown = null;
  }

  onLanguageToggle(event: Event, lang: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filters.languages = checked
      ? [...this.filters.languages, lang]
      : this.filters.languages.filter((l) => l !== lang);
    this.onFilterChange();
  }

  onGameToggle(event: Event, gameId: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filters.games = checked
      ? [...this.filters.games, gameId]
      : this.filters.games.filter((g) => g !== gameId);
    this.onFilterChange();
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const t = event.target as HTMLElement;
    if (!t.closest('.checkbox-collapsible')) {
      this.openDropdown = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(): void {
    this.openDropdown = null;
  }
}
