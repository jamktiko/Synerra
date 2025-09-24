import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'default' | 'highlight';
type ButtonState = 'active' | 'disabled';
type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  imports: [CommonModule],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string; // esim. steam, google, epic, mail
  @Input() variant: ButtonVariant = 'default';
  @Input() state?: ButtonState;
  @Input() size?: ButtonSize;
  @Input() fullWidth: boolean = false;
}
