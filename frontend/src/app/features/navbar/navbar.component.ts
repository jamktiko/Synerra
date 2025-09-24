import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css', '../../../styles.css'],
})
export class NavbarComponent {
  user = {
    name: 'User',
    email: 'Email address',
    avatar: 'account.svg',
  };

  navItems: NavItem[] = [
    { label: 'Home', icon: 'home.svg', route: '/home' },
    { label: 'Games', icon: 'game.svg', route: '/games' },
    { label: 'Social', icon: 'chat.svg', route: '/social' },
    { label: 'Settings', icon: 'settings.svg', route: '/settings' },
  ];

  logout = { label: 'Logout', icon: 'logout.svg', route: '/logout' };
}
