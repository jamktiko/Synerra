import { Component, ViewChild, AfterViewInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingPageComponent } from '../../features/loading-page/loading-page.component';
import { NavbarComponent } from '../../features/navbar/navbar.component';
import { SocialBarComponent } from '../../features/social-bar/social-bar.component';
import { NotificationService } from '../../core/services/notification.service';
import { OnInit } from '@angular/core';
import { UserStore } from '../../core/stores/user.store';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/interfaces/user.model';
import { CommonModule } from '@angular/common';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    SocialBarComponent,
    LoadingPageComponent,
    CommonModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  isNavbarCollapsed = false;
  showLoadingPage = false;
  loggedInUser: User | null = null;

  constructor(
    private notificationService: NotificationService,
    private userStore: UserStore,
    private router: Router,
    private userService: UserService
  ) {}
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  ngOnInit(): void {
    this.showLoadingPage = true;

    // Updates the userStore to have the most recent user data (basically for confirming that recently created account will load)
    this.userService.getMe().subscribe({
      next: (res) => {
        this.userStore.setUser(res);
        this.loggedInUser = res;

        this.notificationService.initConnection();
        this.userService.initUsersOnlineStatus();
        // Checks for every possible login and load case where the user might be at the dashboard. To access the dashboard,
        // user must have authToken that is given when logging in with email. (this is being checked with authStore in app.routes)
        if (this.loggedInUser && !this.loggedInUser.Username) {
          this.showLoadingPage = false;
          console.log('EI OO PROFIILIA PENTELE');
          this.router.navigate(['/profile-creation']);
        }
      },
      error: (err) => {
        console.log('error loading userdata', err);
      },
      complete: () => {
        console.log('profile loaded succesfully!');
        this.showLoadingPage = false;
      },
    });

    console.log('WebSocket Reconnect in progress...');
  }
  ngAfterViewInit(): void {
    this.navbar.collapsedChange.subscribe((collapsed: boolean) => {
      this.isNavbarCollapsed = collapsed;
    });

    this.isNavbarCollapsed = this.navbar.isCollapsed;
  }
}
