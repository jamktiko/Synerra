import { Component } from '@angular/core';
import { SocialMenuComponent } from './social-menu/social-menu.component';
import { SocialBarComponent } from '../social-bar/social-bar.component';

@Component({
  selector: 'app-social-page',
  imports: [SocialMenuComponent, SocialBarComponent],
  templateUrl: './social-page.component.html',
  styleUrl: './social-page.component.css',
})
export class SocialPageComponent {}
