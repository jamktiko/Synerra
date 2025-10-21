import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../features/navbar/navbar.component';
import { SocialBarComponent } from '../../features/social-bar/social-bar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SocialBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent implements AfterViewInit {
  isNavbarCollapsed = false;

  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  ngAfterViewInit(): void {
    this.navbar.collapsedChange.subscribe((collapsed: boolean) => {
      this.isNavbarCollapsed = collapsed;
    });

    this.isNavbarCollapsed = this.navbar.isCollapsed;
  }
}
