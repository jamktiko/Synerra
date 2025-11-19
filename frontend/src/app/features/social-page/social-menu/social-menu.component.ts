import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  input,
  OnInit,
  output,
  SimpleChanges,
} from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

interface User {
  name: string;
  avatar: string;
  lastMessage: string;
}

@Component({
  standalone: true,
  selector: 'app-social-menu',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './social-menu.component.html',
  styleUrl: './social-menu.component.css',
})
export class SocialMenuComponent {
  @Input() totalCount: number | null = 0;
  messagesTabShowing = input<boolean>();
  notificationsClicked = output<string>();

  switchTab(tab: string) {
    this.notificationsClicked.emit(tab);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalNotifications']) {
      console.log(
        'Total notifications changed:',
        changes['totalNotifications'].currentValue
      );
    }
  }
}
