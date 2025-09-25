import { Component, Input } from '@angular/core';
import { Game } from '../../../core/interfaces/game.model';

@Component({
  selector: 'app-game-card',
  imports: [],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  @Input() game!: Game;
}
