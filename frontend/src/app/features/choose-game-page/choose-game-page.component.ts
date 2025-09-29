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

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.loadgames();
  }

  loadgames() {
    this.gameService.listGames().subscribe({
      next: (res) => {
        this.games = res;
        console.log('games:', res);
      },
      error: (err) => {
        console.error('Failed to load games', err);
      },
    });
  }
}
