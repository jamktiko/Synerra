import { Component } from '@angular/core';
import { SocialBarComponent } from './social-bar/social-bar.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [SocialBarComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {}
