import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface NavItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
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
    { label: 'Home', icon: 'home.svg' },
    { label: 'Games', icon: 'game.svg' },
    { label: 'Social', icon: 'chat.svg' },
    { label: 'Settings', icon: 'settings.svg' },
  ];

  logout = { label: 'Logout', icon: 'logout.svg', route: '/logout' };
}
