import { Component } from '@angular/core';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ProfileContentComponent } from './profile-content/profile-content.component';

@Component({
  selector: 'app-profile-page',
  imports: [ProfileHeaderComponent, ProfileContentComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent {}
