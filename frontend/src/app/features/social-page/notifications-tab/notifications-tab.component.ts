import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-notifications-tab',
  imports: [CommonModule],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.css',
})
export class NotificationsTabComponent {}
