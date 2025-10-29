import { Component, ViewChild, AfterViewInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../features/navbar/navbar.component';
import { SocialBarComponent } from '../../features/social-bar/social-bar.component';
import { NotificationService } from '../../core/services/notification.service';
import { OnInit } from '@angular/core';
import { UserStore } from '../../core/stores/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SocialBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  isNavbarCollapsed = false;
  showLoadingPage = false;

  constructor(
    private notificationService: NotificationService,
    private userStore: UserStore,
    private router: Router
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
        this.showLoadingPage = false;
      }
    });
  }
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  ngOnInit(): void {
    this.notificationService.initConnection();
    console.log('WebSocket Reconnect in progress...');
  }
  ngAfterViewInit(): void {
    this.navbar.collapsedChange.subscribe((collapsed: boolean) => {
      this.isNavbarCollapsed = collapsed;
    });

    this.isNavbarCollapsed = this.navbar.isCollapsed;
  }
}
