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

  constructor(
    private notificationService: NotificationService,
    private userStore: UserStore,
    private router: Router,
    private userService: UserService,
  ) {
    // Checks for every possible login and load case where the user might be at the dashboard. To access the dashboard,
    // user must have authToken that is given when logging in with email. (this is being checked with authStore in app.routes)
    effect(() => {
      const user = this.userStore.user();
      if (!user) {
        // Shows loading page if the userdata isn't loaded yet
        this.showLoadingPage = true;
        console.log('loadings');
      } else if (!user?.Username) {
        // When the userdata is loaded, if the user hasn't set up the profile (so has no username), they get thrown to the profile-creation page.
        this.showLoadingPage = false;
        this.router.navigate(['/profile-creation']);
      } else {
        console.log('profile loaded succesfully!');
        this.showLoadingPage = false;
      }
    });
  }
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  ngOnInit(): void {
    this.loadLoggedInUserData();
    this.notificationService.initConnection();
    this.userService.initUsersOnlineStatus();
    console.log('WebSocket Reconnect in progress...');
  }
  ngAfterViewInit(): void {
    this.navbar.collapsedChange.subscribe((collapsed: boolean) => {
      this.isNavbarCollapsed = collapsed;
    });

    this.isNavbarCollapsed = this.navbar.isCollapsed;
  }

  // Updates the userStore to have the most recent user data (basically for confirming that recently created account will load)
  loadLoggedInUserData() {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.userStore.setUser(res);
      },
      error: (err) => console.error('Error loading logged in users data', err),
    });
  }
}
