import {
  Component,
  HostListener,
  OnInit,
  Output,
  EventEmitter,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { User } from '../../core/interfaces/user.model';
import { UserStore } from '../../core/stores/user.store';

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
export class NavbarComponent implements OnInit {
  isCollapsed = false;
  private hasUserPreference = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  user: User | null = null;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'Home.svg', route: '/dashboard' },
    { label: 'Games', icon: 'Gamepad.svg', route: '/dashboard/choose-game' },
    { label: 'Social', icon: 'NoMessage.svg', route: '/dashboard/social' },
    { label: 'Settings', icon: 'Settings.svg', route: '/dashboard/settings' },
  ];

  logout = { label: 'Logout', icon: 'Logout.svg', route: '/login' };

  constructor(private userStore: UserStore) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.user = user;
      }
    });
  }
  // get user(): User | null {
  //   return this.userStore.user();
  // }
  ngOnInit(): void {
    const saved = localStorage.getItem('navbarCollapsed');
    if (saved !== null) {
      this.isCollapsed = saved === 'true';
      this.hasUserPreference = true;
    } else if (typeof window !== 'undefined' && window.innerWidth < 900) {
      this.isCollapsed = true;
    }
    this.checkAutoCollapse();
    this.collapsedChange.emit(this.isCollapsed);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.hasUserPreference = true;
    localStorage.setItem('navbarCollapsed', String(this.isCollapsed));
    this.collapsedChange.emit(this.isCollapsed);
  }

  @HostListener('window:scroll', [])
  @HostListener('window:resize', [])
  checkAutoCollapse() {
    if (this.hasUserPreference) return;

    const layout = document.querySelector('.layout') as HTMLElement;
    if (!layout) return;

    const layoutRect = layout.getBoundingClientRect();
    this.isCollapsed = layoutRect.top < 0;
    this.collapsedChange.emit(this.isCollapsed);
  }

  onUserClick(): void {
    console.log('User button clicked');
  }
}
