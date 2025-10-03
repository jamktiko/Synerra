import { Component } from '@angular/core';
import { ProfileComponent } from './profile/profile.component';
import { SocialBarComponent } from '../social-bar/social-bar.component';

@Component({
  selector: 'app-profile-page',
  imports: [SocialBarComponent, ProfileComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent {}
