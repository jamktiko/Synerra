import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FriendService } from '../../core/services/friend.service';
import { User } from '../../core/interfaces/user.model';
import { ChatService } from '../../core/services/chat.service';
import { map, Observable } from 'rxjs';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-social-bar',
  imports: [CommonModule, NotificationsComponent],
  templateUrl: './social-bar.component.html',
  styleUrls: ['./social-bar.component.css', '../../../styles.css'],
})
export class SocialBarComponent implements AfterViewInit {
  users$: Observable<User[]>;
  notificationsOpen = false;
  inlineHost?: ViewContainerRef;
  inlineHostElement?: HTMLElement;

  @ViewChild('notificationsHost', { read: ViewContainerRef })
  private notificationsHostRef?: ViewContainerRef;
  @ViewChild('notificationsHost', { read: ElementRef })
  private notificationsHostElementRef?: ElementRef<HTMLElement>;
  onlineUsers$: Observable<User[]>;

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {
    this.users$ = this.friendService.friends$.pipe(
      map((friends) =>
        [...friends].sort((a, b) => {
          // Online users first
          if (a.Status === 'online' && b.Status !== 'online') return -1;
          if (a.Status !== 'online' && b.Status === 'online') return 1;
          return 0; // keep the original order if both same
        })
      )
    );
    this.onlineUsers$ = this.users$.pipe(
      map((friends) => friends.filter((f) => f.Status === 'online'))
    );
  }

  ngOnInit() {
    // Subscribe first to catch updates
    this.friendService.friends$.subscribe((friends) => {
      console.log('Reactive friends:', friends);
    });

    // Trigger initial fetch after subscription
    this.friendService.getFriends().subscribe({
      next: (res) => console.log('Initial fetch complete', res),
      error: (err) => console.error(err),
    });
    console.log(this.users$);
  }

  ngAfterViewInit(): void {
    this.inlineHost = this.notificationsHostRef;
    this.inlineHostElement = this.notificationsHostElementRef?.nativeElement;
    this.cdr.detectChanges();
  }

  onNotificationsToggle(open: boolean) {
    this.notificationsOpen = open;
    if (!open) {
      this.inlineHost?.clear();
    }
  }

  userClicked(userId: any) {
    this.chatService.startChat([userId]);
  }
}
