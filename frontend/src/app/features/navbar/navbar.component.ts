import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  user = {
    name: 'User',
    email: 'Email address',
    avatar: 'svg/Acount.svg',
  };

  navItems: NavItem[] = [
    { label: 'Home', icon: 'Home.svg', route: '/dashboard' },
    { label: 'Games', icon: 'Gamepad.svg', route: '/dashboard/find-players' },
    { label: 'Social', icon: 'NoMessage.svg', route: '/dashboard/social' },
    { label: 'Settings', icon: 'Settings.svg', route: '/dashboard/settings' },
  ];

  logout = { label: 'Logout', icon: 'Logout.svg', route: '/login' };
}
