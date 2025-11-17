import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface NotificationOption {
  key: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.css',
})
export class NotificationSettingsComponent {
  readonly notificationForm: FormGroup;
  readonly emailTopics: NotificationOption[] = [
    { key: 'friendRequests', label: 'Friend requests' },
    { key: 'unreadMessages', label: 'Unread chat messages' },
    {
      key: 'groupInvites',
      label: 'Group invitations',
      description: 'Alerts when a fireteam wants to add you.',
    },
    {
      key: 'groupMentions',
      label: 'Group mentions',
      description: 'Pings when someone tags @you.',
    },
    { key: 'pushNotifications', label: 'Push notifications mirrored' },
    { key: 'latestNews', label: 'Latest news & feature drops' },
  ];

  saveFeedback = '';

  constructor(private readonly fb: FormBuilder) {
    this.notificationForm = this.fb.group({
      allowEmails: [true],
      emailTopics: this.fb.group(this.createControls(this.emailTopics)),
    });
  }

  get emailTopicsGroup(): FormGroup {
    return this.notificationForm.get('emailTopics') as FormGroup;
  }

  saveChanges(): void {
    if (!this.notificationForm.valid) {
      this.notificationForm.markAllAsTouched();
      return;
    }
    this.saveFeedback = 'Preferences saved just now.';
    setTimeout(() => {
      this.saveFeedback = '';
    }, 4000);
  }

  trackByKey(_: number, option: NotificationOption): string {
    return option.key;
  }

  private createControls(
    options: NotificationOption[],
  ): Record<string, boolean> {
    return options.reduce<Record<string, boolean>>((controls, option) => {
      controls[option.key] = true;
      return controls;
    }, {});
  }
}
