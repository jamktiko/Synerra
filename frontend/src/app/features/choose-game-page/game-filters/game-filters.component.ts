import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ButtonComponent } from '../../../shared/components/button/button.component';

// Define a filter object type
export interface GameFilters {
  search: string;
  genre: string;
  sortByPopularity: boolean;
}

@Component({
  selector: 'app-game-filters',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './game-filters.component.html',
  styleUrl: './game-filters.component.css',
})
export class GameFiltersComponent {
  selectedGenre: string = '';
  selectedGenreLabel = 'Select a category';
  searchControl = new FormControl('');
  sortByPopularity: boolean = false;
  genreDropdownOpen = false;

  readonly genres = [
    { label: 'Select a category', value: '' },
    { label: 'Shooter', value: 'shooter' },
    { label: 'Moba', value: 'moba' },
    { label: 'Battle Royale', value: 'br' },
    { label: 'Other', value: 'other' },
  ];

  // Emit the event so that the parent component can use it
  @Output() filterChanged = new EventEmitter<GameFilters>();

  constructor(private elementRef: ElementRef) {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // wait 500ms after user stops typing
        distinctUntilChanged() // only emit if value actually changed
      )
      .subscribe(() => {
        this.emitFilters();
      });
  }

  // When the genre is changed emit the event
  onGenreChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement | null;

    if (!selectElement) return;

    this.setGenre(selectElement.value);
  }

  // Emit the event so that the parent component can use it
  @Output() sortToggled = new EventEmitter<void>();
  // When the sort is changed emit the event
  onToggleSort() {
    this.sortByPopularity = !this.sortByPopularity;
    this.sortToggled.emit();
    this.emitFilters();
  }

  // Helper method to emit all filters together
  private emitFilters() {
    this.filterChanged.emit({
      search: this.searchControl.value ?? '',
      genre: this.selectedGenre,
      sortByPopularity: this.sortByPopularity,
    });
  }

  toggleGenreDropdown() {
    this.genreDropdownOpen = !this.genreDropdownOpen;
  }

  selectGenre(value: string) {
    this.setGenre(value);
    this.genreDropdownOpen = false;
  }

  private setGenre(value: string) {
    this.selectedGenre = value;
    const match =
      this.genres.find((genre) => genre.value === value)?.label ??
      'Select a category';
    this.selectedGenreLabel = match;
    this.emitFilters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.genreDropdownOpen = false;
    }
  }
}
