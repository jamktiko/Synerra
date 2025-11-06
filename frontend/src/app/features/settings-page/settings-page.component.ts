import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingPageStore } from '../../core/stores/loadingPage.store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {
  constructor(
    private loadingPageStore: LoadingPageStore,
    private authService: AuthService,
    private router: Router
  ) {}

  logOut(): void {
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
