import { Component } from '@angular/core';
import { SocialBarComponent } from '../social-bar/social-bar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [SocialBarComponent, DashboardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: (res: User[]) => {
        console.log('Fetched users:', res); // logs the data
        this.users = res;
      },
      error: (err: any) => console.error('Error fetching users', err),
    });
  }
}
