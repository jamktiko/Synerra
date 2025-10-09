import { Component, HostListener, OnInit, effect } from '@angular/core';
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

  user: User | null = null;

  navItems: NavItem[] = [
    { label: 'Home', icon: 'Home.svg', route: '/dashboard' },
    { label: 'Games', icon: 'Gamepad.svg', route: '/dashboard/choose-game' },
    { label: 'Social', icon: 'NoMessage.svg', route: '/dashboard/social' },
    { label: 'Settings', icon: 'Settings.svg', route: '/dashboard/settings' },
  ];

  navItemsMobile: NavItem[] = [
    { label: 'Settings', icon: 'Settings.svg', route: '/dashboard/settings' },
    { label: 'Games', icon: 'Gamepad.svg', route: '/dashboard/find-players' },
    { label: 'Home', icon: 'logo_small.svg', route: '/dashboard' },
    { label: 'Social', icon: 'NoMessage.svg', route: '/dashboard/social' },
    { label: 'Profile', icon: 'Acount.svg', route: '/dashboard/profile-page' },
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
    } else if (typeof window !== 'undefined' && window.innerWidth < 600) {
      // Ensikäynnillä pienillä näytöillä voit halutessasi aloittaa collapsedina
      this.isCollapsed = true;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.hasUserPreference = true;
    localStorage.setItem('navbarCollapsed', String(this.isCollapsed));
  }

  // Pikanäppäin: Ctrl/Cmd + B togglaa navin
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      this.toggleCollapse();
    }
  }

  // Responsiivisuus: kun käyttäjällä ei ole omaa preferenssiä, voidaan pienen näytön tulla collapsed-tilaan
  @HostListener('window:resize')
  onResize() {
    if (!this.hasUserPreference) {
      if (window.innerWidth < 600) this.isCollapsed = true;
      // ei pakoteta takaisin expanded-tilaan, jos käyttäjä on tottunut collapsediin
    }
  }

  onUserClick(): void {
    // TODO: lisää reitti tai avaa käyttäjävalikko
    // Esim: this.router.navigate(['/dashboard/account']);
    console.log('User button clicked');
  }
}
