import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Game } from '../../../../core/interfaces/game.model';

@Component({
  selector: 'app-dashboard-card',
  imports: [],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.css',
})
export class DashboardCardComponent {
  @Input() game: any;
}
