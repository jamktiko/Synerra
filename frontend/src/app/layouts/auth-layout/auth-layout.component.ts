import { Component, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingPageComponent } from '../../features/loading-page/loading-page.component';
import { LoadingPageStore } from '../../core/stores/loadingPage.store';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoadingPageComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {
  showLoadingPage: boolean = false;

  constructor(private loadingPageStore: LoadingPageStore) {
    effect(() => {
      this.showLoadingPage = this.loadingPageStore.authLayoutLoadingPage();
    });
  }
}
