import {
  Component,
  HostListener,
  OnInit,
  Output,
  EventEmitter,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Params,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { User } from '../../core/interfaces/user.model';
import { UserStore } from '../../core/stores/user.store';
import { AuthStore } from '../../core/stores/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavChild[];
}

interface NavChild {
  label: string;
  icon?: string;
  route: string;
  queryParams?: Params;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ButtonComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isCollapsed = false;
  private hasUserPreference = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  user: User | null = null;
  currentUrl = '';
  expandedGroups = new Set<string>();

  navItems: NavItem[] = [
    { label: 'Home', icon: 'Home', route: '/dashboard' },
    { label: 'Games', icon: 'Gamepad', route: '/dashboard/choose-game' },
    { label: 'Users', icon: 'Acount', route: '/dashboard/find-players' },
    { label: 'Social', icon: 'NoMessage', route: '/dashboard/social' },
    {
      label: 'Settings',
      icon: 'Settings',
      children: [
        { label: 'Profile', icon: 'Acount', route: '/dashboard/profile' },
        {
          label: 'Account',
          icon: 'Settings',
          route: '/dashboard/settings',
          queryParams: { section: 'account' },
        },
        {
          label: 'Notifications',
          icon: 'NoMessage',
          route: '/dashboard/settings',
          queryParams: { section: 'notifications' },
        },
      ],
    },
  ];

  navItemsMobile: NavItem[] = [
    { label: 'Settings', icon: 'Settings', route: '/dashboard/settings' },
    { label: 'Games', icon: 'Gamepad', route: '/dashboard/choose-game' },
    { label: 'Home', icon: 'logo_small', route: '/dashboard' },
    { label: 'Social', icon: 'NoMessage', route: '/dashboard/social' },
    { label: 'Profile', icon: 'Acount', route: '/dashboard/profile' },
  ];

  logout = { label: 'Logout', icon: 'Logout', route: '/login' };

  constructor(
    private userStore: UserStore,
    private router: Router,
    private authStore: AuthStore
  ) {
    // Sets up a reactive watcher that updates user
    effect(() => {
      const user = this.userStore.user();
      if (user) {
        this.user = user;
      }
    });

    this.currentUrl = this.router.url;
    this.syncExpandedState(this.currentUrl);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.syncExpandedState(this.currentUrl);
      });
  }

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
    this.syncExpandedState(this.currentUrl);
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.hasUserPreference = true;
    localStorage.setItem('navbarCollapsed', String(this.isCollapsed));
    this.collapsedChange.emit(this.isCollapsed);
  }

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
    this.router.navigate(['/dashboard/profile']);
  }

  // Clearing authToken and rerouting to the login-page when logging off
  logOut() {
    this.authStore.clearToken();
    this.router.navigate(['/login']);
  }

  toggleGroup(item: NavItem): void {
    if (!item.children || !item.children.length) {
      if (item.route) {
        this.router.navigate([item.route]);
      }
      return;
    }
    const key = item.label;
    if (this.expandedGroups.has(key)) {
      this.expandedGroups.delete(key);
    } else {
      this.expandedGroups.clear();
      this.expandedGroups.add(key);
    }
  }

  isGroupExpanded(item: NavItem): boolean {
    return item.children ? this.expandedGroups.has(item.label) : false;
  }

  isGroupActive(item: NavItem): boolean {
    if (!item.children) {
      return false;
    }
    return item.children.some((child) => this.matchesChildRoute(child, this.currentUrl));
  }

  getSubmenuHeight(item: NavItem): string {
    if (!item.children || !this.isGroupExpanded(item) || this.isCollapsed) {
      return '0px';
    }
    const rowHeight = 48;
    return `${item.children.length * rowHeight}px`;
  }

  getIconPath(icon: string): string {
    return `assets/svg/${icon}.svg`;
  }

  trackByLabel(_: number, item: NavItem): string {
    return item.label;
  }

  private syncExpandedState(url: string): void {
    this.navItems.forEach((item) => {
      if (!item.children || !item.children.length) {
        return;
      }
      const hasMatch = item.children.some((child) => this.matchesChildRoute(child, url));
      if (hasMatch) {
        this.expandedGroups.add(item.label);
      }
    });
  }

  private matchesChildRoute(child: NavChild, url: string): boolean {
    const [path, search = ''] = url.split('?');
    if (child.exact === false) {
      return path.startsWith(child.route);
    }
    if (path !== child.route) {
      return false;
    }
    if (!child.queryParams) {
      return true;
    }
    const params = new URLSearchParams(search);
    return Object.entries(child.queryParams).every(
      ([key, value]) => params.get(key) === String(value)
    );
  }
}
