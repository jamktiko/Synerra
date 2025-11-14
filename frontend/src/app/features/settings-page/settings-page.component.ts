import { Component } from '@angular/core';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [NotificationSettingsComponent],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {}
