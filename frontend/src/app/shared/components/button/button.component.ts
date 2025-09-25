import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type ButtonVariant = 'default' | 'highlight';
type ButtonState = 'active' | 'disabled';
type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  imports: [CommonModule, RouterModule],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string; // esim. steam, google, epic, mail
  @Input() variant: ButtonVariant = 'default';
  @Input() state?: ButtonState;
  @Input() size?: ButtonSize;
  @Input() fullWidth: boolean = false;
  @Input() routerLink?: string;
}
