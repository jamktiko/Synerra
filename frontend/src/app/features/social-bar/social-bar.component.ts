import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FriendService } from '../../core/services/friend.service';
import { User } from '../../core/interfaces/user.model';
import { ChatService } from '../../core/services/chat.service';
import { map, Observable } from 'rxjs';
import { NotificationsComponent } from '../notifications/notifications.component';
import { Router } from '@angular/router';

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
  openDropdownUserId: string | null = null;

  @ViewChild('notificationsHost', { read: ViewContainerRef })
  private notificationsHostRef?: ViewContainerRef;

  @ViewChild('notificationsHost', { read: ElementRef })
  private notificationsHostElementRef?: ElementRef<HTMLElement>;

  onlineUsers$: Observable<User[]>;

  constructor(
    private friendService: FriendService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private elementRef: ElementRef // ← tärkeä HostListenerille
  ) {
    // gets friends from service
    // Sort online users first
    this.users$ = this.friendService.friends$.pipe(
      map((friends) =>
        [...friends].sort((a, b) => {
          if (a.Status === 'online' && b.Status !== 'online') return -1;
          if (a.Status !== 'online' && b.Status === 'online') return 1;
          return 0;
        })
      )
    );
    //get the online friends

    this.onlineUsers$ = this.users$.pipe(
      map((friends) => friends.filter((f) => f.Status === 'online'))
    );
  }

  ngOnInit() {
    this.friendService.friends$.subscribe((friends) => {
      console.log('Reactive friends:', friends);
    });

    this.friendService.getFriends().subscribe({
      next: (res) => console.log('Initial fetch complete', res),
      error: (err) => console.error(err),
    });
  }

  ngAfterViewInit(): void {
    this.inlineHost = this.notificationsHostRef;
    this.inlineHostElement = this.notificationsHostElementRef?.nativeElement;
    this.cdr.detectChanges();
  }

  onNotificationsToggle(open: boolean) {
    this.notificationsOpen = open;
    if (!open) this.inlineHost?.clear();
  }

  toggleDropdown(userId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!userId) return;

    this.openDropdownUserId =
      this.openDropdownUserId === userId ? null : userId;
  }

  // on click open chat
  openChat(userId: string | undefined) {
    if (!userId) return;
    this.chatService.startChat([userId]);
    this.openDropdownUserId = null;
  }

  openProfile(userId: string | undefined) {
    if (!userId) return;
    this.router.navigate([`dashboard/profile/${userId}`]);
    this.openDropdownUserId = null;
  }

  /**
   * Dropdown sulkeutuu aina, kun klikataan komponentin ulkopuolelle.
   * Tämä toimii myös, kun käyttäjä klikkaa eri ohjelmaa ja palaa takaisin.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside && this.openDropdownUserId !== null) {
      this.openDropdownUserId = null;
    }
  }
  @HostListener('window:blur')
  onWindowBlur() {
    this.openDropdownUserId = null;
  }

  @HostListener('window:focus')
  onWindowFocus() {
    if (this.openDropdownUserId !== null) {
      this.openDropdownUserId = null;
    }
  }
}
