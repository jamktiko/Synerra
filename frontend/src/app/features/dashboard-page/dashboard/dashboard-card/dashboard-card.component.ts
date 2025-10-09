import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Game } from '../../../../core/interfaces/game.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-card',
  imports: [],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.css',
})
export class DashboardCardComponent {
  @Input() game: any;
  constructor(private router: Router) {}
  selectGame(game: any) {
    this.router.navigate(['dashboard/find-players'], {
      queryParams: { game: game.PK.replace('GAME#', '') },
    });
  }
}
