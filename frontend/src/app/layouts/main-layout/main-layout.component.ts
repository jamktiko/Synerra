import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../features/navbar/navbar.component';
import { SocialBarComponent } from '../../features/social-bar/social-bar.component';
import { NotificationService } from '../../core/services/notification.service';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SocialBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  isNavbarCollapsed = false;

  constructor(private notificationService: NotificationService) {}
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
