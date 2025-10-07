import { Component, Input } from '@angular/core';
import { Game } from '../../../core/interfaces/game.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-card',
  imports: [],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css',
})
export class GameCardComponent {
  @Input() game!: Game;

  constructor(private router: Router) {}

  selectGame(game: any) {
    this.router.navigate(['dashboard/find-players'], {
      queryParams: { game: game.PK.replace('GAME#', '') },
    });
  }
}
