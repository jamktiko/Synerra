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
import { LoadingPageStore } from '../../core/stores/loadingPage.store';
import { AuthService } from '../../core/services/auth.service';
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
  // private hasUserPreference = false; //REMOVED for UX, seemed like a bug more than a feature
  // Lines 133 & 157 also removed
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
        {
          label: 'Profile',
          icon: 'Acount',
          route: '/dashboard/settings/profile',
        },
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

  get isTemporarilyExpanded(): boolean {
    return this.isCollapsed && this.expandedGroups.size > 0;
  }

  constructor(
    private userStore: UserStore,
    private router: Router,
    private authService: AuthService,
    private loadingPageStore: LoadingPageStore,
  ) {
    // Watch for user changes reactively
    effect(() => {
      const user = this.userStore.user();
      if (user && user.UserId) {
        this.user = user;
        this.buildNavItemsMobile(user.UserId);
      }
    });

    this.currentUrl = this.router.url;
    this.syncExpandedState(this.currentUrl);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.syncExpandedState(this.currentUrl);
      });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('navbarCollapsed');
    if (saved !== null) {
      this.isCollapsed = saved === 'true';
      // this.hasUserPreference = true; //REMOVED for UX
    } else if (typeof window !== 'undefined' && window.innerWidth < 1070) {
      this.isCollapsed = true;
    }
    this.checkAutoCollapse();
    this.collapsedChange.emit(this.isCollapsed);
    this.syncExpandedState(this.currentUrl);
  }

  private buildNavItemsMobile(userId: string): void {
    this.navItemsMobile = [
      { label: 'Settings', icon: 'Settings', route: '/dashboard/settings' },
      { label: 'Games', icon: 'Gamepad', route: '/dashboard/choose-game' },
      { label: 'Home', icon: 'logo_small', route: '/dashboard' },
      { label: 'Social', icon: 'NoMessage', route: '/dashboard/social' },
      {
        label: 'Profile',
        icon: 'Acount',
        route: `/dashboard/profile/${userId}`,
      },
    ];
  }
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    // this.hasUserPreference = true; //REMOVED for UX
    localStorage.setItem('navbarCollapsed', String(this.isCollapsed));
    this.collapsedChange.emit(this.isCollapsed);
  }

  @HostListener('window:resize', [])
  checkAutoCollapse() {
    if (typeof window === 'undefined') return;

    const isBelowDesktopBreakpoint = window.innerWidth < 1070;

    if (isBelowDesktopBreakpoint) {
      if (!this.isCollapsed) {
        this.isCollapsed = true;
        this.collapsedChange.emit(this.isCollapsed);
      }
      return;
    }

    // Always expand when resizing back up (even if user had preference)
    if (this.isCollapsed) {
      this.isCollapsed = false;
      this.collapsedChange.emit(this.isCollapsed);
    }
  }

  onUserClick(): void {
    console.log('User button clicked');
    this.router.navigate([`/dashboard/profile/${this.user?.UserId}`]);
  }

  // Clearing authToken and rerouting to the login-page when logging off
  logOut() {
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);
    this.authService.logout();
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
    return item.children.some((child) =>
      this.matchesChildRoute(child, this.currentUrl),
    );
  }

  getSubmenuHeight(item: NavItem): string {
    const collapsedWithoutExpansion =
      this.isCollapsed && !this.isTemporarilyExpanded;

    if (
      !item.children ||
      !this.isGroupExpanded(item) ||
      collapsedWithoutExpansion
    ) {
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
      const hasMatch = item.children.some((child) =>
        this.matchesChildRoute(child, url),
      );
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
      ([key, value]) => params.get(key) === String(value),
    );
  }
}
