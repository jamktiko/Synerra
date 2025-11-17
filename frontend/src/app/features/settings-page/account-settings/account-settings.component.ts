import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { LoadingPageStore } from '../../../core/stores/loadingPage.store';
import { AuthService } from '../../../core/services/auth.service';

type LinkProviderId = 'steam' | 'epic' | 'discord';

interface LinkProvider {
  id: LinkProviderId;
  label: string;
  description: string;
  initials: string;
  icon?: string;
}

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.css',
})
export class AccountSettingsComponent {
  readonly passwordForm: FormGroup;

  readonly linkProviders: LinkProvider[] = [
    {
      id: 'steam',
      label: 'Connect Steam',
      description: 'Sync your Steam stats and hours.',
      initials: 'S',
      icon: 'assets/svg/Steam.svg',
    },
    {
      id: 'epic',
      label: 'Connect Epic Games',
      description: 'Pull in Epic achievements.',
      initials: 'E',
      icon: 'assets/svg/EpicGames.svg',
    },
    {
      id: 'discord',
      label: 'Connect Discord',
      description: 'Show Discord presence to friends.',
      initials: 'D',
    },
  ];

  readonly linkedAccounts: Record<LinkProviderId, boolean> = {
    steam: false,
    epic: false,
    discord: false,
  };

  feedbackMessage = '';
  feedbackType: 'success' | 'warning' | '' = '';
  lastPasswordChange = 'Never';
  showDeleteConfirmation = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly loadingPageStore: LoadingPageStore,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  get passwordMismatch(): boolean {
    return (
      this.passwordForm.hasError('mismatch') &&
      this.passwordForm.get('confirmPassword')?.touched === true
    );
  }

  get linkedCount(): number {
    return Object.values(this.linkedAccounts).filter((linked) => linked).length;
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.lastPasswordChange = 'Just now';
    this.feedbackType = 'success';
    this.feedbackMessage = 'Password updated successfully (demo action).';
    this.passwordForm.reset();
  }

  toggleLink(providerId: LinkProviderId): void {
    this.linkedAccounts[providerId] = !this.linkedAccounts[providerId];
    const label = this.linkProviders.find((p) => p.id === providerId)?.label;
    this.feedbackType = 'success';
    this.feedbackMessage = this.linkedAccounts[providerId]
      ? `${label ?? 'Account'} connected.`
      : `${label ?? 'Account'} disconnected.`;
  }

  isLinked(providerId: LinkProviderId): boolean {
    return this.linkedAccounts[providerId];
  }

  requestDeletion(): void {
    this.showDeleteConfirmation = true;
  }

  cancelDeletion(): void {
    this.showDeleteConfirmation = false;
    this.feedbackMessage = '';
    this.feedbackType = '';
  }

  confirmDeletion(): void {
    this.showDeleteConfirmation = false;
    this.feedbackType = 'warning';
    this.feedbackMessage =
      'Account deletion request sent (placeholder implementation).';
  }

  logOut(): void {
    this.loadingPageStore.setAuthLayoutLoadingPageVisible(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }
}
