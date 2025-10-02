import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-game-filters',
  imports: [],
  templateUrl: './game-filters.component.html',
  styleUrl: './game-filters.component.css',
})
export class GameFiltersComponent {
  selectedGenre: string = '';

  // Emit the event so that the parent component can use it
  @Output() filterChanged = new EventEmitter<string>();

  // When the genre is changed emit the event
  onGenreChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement | null;

    if (!selectElement) return;

    this.selectedGenre = selectElement.value;
    console.log(this.selectedGenre);
    this.filterChanged.emit(this.selectedGenre);
  }

  // Emit the event so that the parent component can use it
  @Output() sortToggled = new EventEmitter<void>();
  // When the sort is changed emit the event
  onToggleSort() {
    this.sortToggled.emit();
  }
}
