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
import { Observable } from 'rxjs';
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

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {
    this.users$ = this.friendService.friends$;
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

  //VANHA LOAD USERS
  // loadUsers() {
  //   this.friendService.getFriends().subscribe({
  //     next: (res) => {
  //       this.users = res.users;
  //       console.log('Users:', res.users);
  //     },
  //     error: (err) => {
  //       console.error('Failed to load users', err);
  //     },
  //   });
  // }

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
