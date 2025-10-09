import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Define a filter object type
export interface GameFilters {
  search: string;
  genre: string;
  sortByPopularity: boolean;
}

@Component({
  selector: 'app-game-filters',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './game-filters.component.html',
  styleUrl: './game-filters.component.css',
})
export class GameFiltersComponent {
  selectedGenre: string = '';
  searchControl = new FormControl('');
  sortByPopularity: boolean = false;

  // Emit the event so that the parent component can use it
  @Output() filterChanged = new EventEmitter<GameFilters>();

  constructor() {
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

    this.selectedGenre = selectElement.value;
    console.log(this.selectedGenre);
    this.emitFilters();
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
}
