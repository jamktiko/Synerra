import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type ButtonVariant = 'default' | 'highlight';
type ButtonState = 'active' | 'disabled';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonAlign = 'left' | 'center';
type IconPosition = 'left' | 'right';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  imports: [CommonModule, RouterModule],
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() variant: ButtonVariant = 'default';
  @Input() state?: ButtonState;
  @Input() size: ButtonSize = 'medium';
  @Input() iconPosition: IconPosition = 'left';

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

  private coerceBoolean(v: any): boolean {
    return v === '' || v === true || v === 'true' || v === 'on';
  }
}
