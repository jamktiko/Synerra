import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

type ButtonVariant = 'default' | 'highlight' | 'sidebar';
type ButtonState = 'active' | 'disabled';
type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';
type ButtonAlign = 'left' | 'center';
type IconPosition = 'left' | 'right';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  imports: [CommonModule, RouterModule],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'medium';
  @Input() iconPosition: IconPosition = 'left';
  @Input() routerLink?: string | any[];
  @Input() routerLinkExact: boolean = true;
  @Input() ariaLabel?: string;

  private _fullWidth = false;

  @Input('fullWidth')
  set fullWidth(val: any) {
    this._fullWidth = this.coerceBoolean(val);
  }
  get fullWidth(): boolean {
    return this._fullWidth;
  }

  @Input('full-width')
  set fullWidthKebab(val: any) {
    this.fullWidth = val;
  }

  @Input() align: ButtonAlign = 'center';

  private _state?: ButtonState;

  @Input()
  set state(value: ButtonState | undefined) {
    this._state = value;
  }
  get state(): ButtonState | undefined {
    return this._state;
  }

  @Input('buttonState')
  set buttonState(value: ButtonState | undefined) {
    this._state = value;
  }

  constructor(private router: Router) {}

  navigate() {
    if (this.state === 'disabled') {
      return;
    }
  }

  private coerceBoolean(v: any): boolean {
    return v === '' || v === true || v === 'true' || v === 'on';
  }
}
