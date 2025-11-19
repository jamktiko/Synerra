import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  EmbeddedViewRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  Subscription,
} from 'rxjs';

import {
  NormalizedMessage,
  NormalizedRequest,
  UnreadMessage,
} from '../../core/interfaces/chatMessage';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';

import { UserService } from '../../core/services/user.service';
import { ChatService } from '../../core/services/chat.service';
import { FriendService } from '../../core/services/friend.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationStore } from '../../core/stores/notification.store';
import { WebsocketFriendRequest } from '../../core/interfaces/friend.model';
type AnyRequest = FriendRequest | WebsocketFriendRequest;
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [CommonModule, ButtonComponent],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  messages$: Observable<NormalizedMessage[]>;
  friendRequests$: Observable<NormalizedRequest[]>;
  totalCount$: Observable<number>;
  showDropdown = false;
  activeTab: 'messages' | 'requests' = 'messages';
  readonly dropdownContext = { inline: false };

  private inlineView?: EmbeddedViewRef<{ inline: boolean }>;
  private _inlineHost?: ViewContainerRef;
  private sub: Subscription | null = null;

  @ViewChild('panelTemplate') panelTemplate!: TemplateRef<{ inline: boolean }>;

  @Input()
  set inlineHost(host: ViewContainerRef | undefined) {
    if (this._inlineHost === host) return;
    if (this.inlineView) {
      this.inlineView.destroy();
      this.inlineView = undefined;
    }
    this._inlineHost = host;
    this.syncInlineView();
  }
  get inlineHost(): ViewContainerRef | undefined {
    return this._inlineHost;
  }

  @Input() inlineHostElement?: HTMLElement;

  @Output() dropdownChanged = new EventEmitter<boolean>();

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private host: ElementRef,
    private notificationStore: NotificationStore
  ) {
    // Use normalized store output
    this.messages$ = this.notificationStore.messageNotifications.pipe(
      map((msgs) =>
        msgs.map((m) => ({
          senderUsername: m.senderUsername || 'Unknown',
          content: m.content || '',
          timestamp: m.timestamp || Date.now(),
          roomId: m.roomId || '', // add this
          profilePicture: m.profilePicture || '', // add this
        }))
      )
    );

    this.friendRequests$ = this.notificationStore.friendRequests.pipe(
      map((reqs) =>
        reqs.map((r: AnyRequest) => {
          let status: 'PENDING' | 'ACCEPTED' | 'DECLINED' = 'PENDING';
          let type: string;

          // WebSocket request has 'type'
          if ('type' in r && r.type) {
            type = r.type;
            if (type === 'friend_request') status = 'PENDING';
            else if (type === 'friend_request_accepted') status = 'ACCEPTED';
            else if (type === 'friend_request_declined') status = 'DECLINED';
          } else if ('Status' in r && r.Status) {
            status = r.Status as 'PENDING' | 'ACCEPTED' | 'DECLINED';
            // derive type from status
            type =
              status === 'PENDING'
                ? 'friend_request'
                : status === 'ACCEPTED'
                ? 'friend_request_accepted'
                : 'friend_request_declined';
          } else {
            // fallback if neither exists
            type = 'friend_request';
          }

          const fromUserId =
            'fromUserId' in r ? r.fromUserId : (r as any).SenderId;
          const fromUsername =
            'fromUsername' in r
              ? r.fromUsername
              : (r as any).SenderUsername || 'Unknown';
          const timestamp =
            'timestamp' in r ? r.timestamp : (r as any).Timestamp || Date.now();
          const senderPicture =
            'senderPicture' in r
              ? r.senderPicture
              : (r as any).SenderPicture || (r as any).fromPicture || '';
          const toUserId = (r as any).toUserId ?? '';

          const message =
            status === 'PENDING'
              ? `${fromUsername} sent you a friend request`
              : status === 'ACCEPTED'
              ? `${fromUsername} accepted your friend request`
              : `${fromUsername} declined your friend request`;

          return {
            fromUserId,
            fromUsername,
            timestamp,
            senderPicture,
            status,
            toUserId,
            type,
            message,
          };
        })
      )
    );

    // Combined total count
    this.totalCount$ = combineLatest([
      this.messages$,
      this.friendRequests$,
    ]).pipe(map(([msgs, reqs]) => msgs.length + reqs.length));
  }

  ngOnInit(): void {
    this.sub = this.friendRequests$.subscribe((requests) => {
      console.log('Current friend requests:', requests);
    });
  }
  ngOnDestroy(): void {
    // Clean up inline views
    if (this.inlineView) {
      this.inlineView.destroy();
      this.inlineView = undefined;
    }

    // Unsubscribe from notification stream
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

  // accept friend request
  async acceptRequest(targetUserId: string) {
    const requests = await firstValueFrom(this.friendRequests$);
    const request = requests.find((req) => req.fromUserId === targetUserId);
    const username = request?.fromUsername || 'User';

    this.friendService.acceptFriendRequest(targetUserId).subscribe({
      next: () => {
        // No local friendRequests array anymore, update the store if needed
        this.notificationStore.removeFriendRequest(targetUserId);
        alert(`Friend request from ${username} accepted`);
      },
      error: (err) => console.error('Failed to accept request', err),
    });
  }

  // decline friend request
  async declineRequest(targetUserId: string) {
    // Get the current friend requests from the store
    const requests = await firstValueFrom(this.friendRequests$);
    const request = requests.find((req) => req.fromUserId === targetUserId);
    const username = request?.fromUsername || 'User';

    this.friendService.declineFriendRequest(targetUserId).subscribe({
      next: () => {
        // Remove the request from the store
        this.notificationStore.removeFriendRequest(targetUserId);
        alert(`Friend request from ${username} declined`);
      },
      error: (err) => console.error('Failed to decline request', err),
    });
  }

  // Clears accepted or declined requests from database and state
  clearRequest(userId: string) {
    this.friendService.clearAcceptedDeclinedRequests(userId).subscribe({
      next: (res) => {
        console.log(
          `Cleared ${res.deletedCount} accepted/declined requests from this user.`
        );
        // Update the store locally
        this.notificationStore.removeFriendRequest(userId);
      },
      error: (err) => {
        console.error('Failed to clear requests', err);
        alert('Failed to clear requests. Check console for details.');
      },
    });

    console.log(`Cleared requests from user ${userId}`);
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.setDropdownState(!this.showDropdown);
  }

  // Starts chat when clicking notification and removes notifications from that sender
  userClicked(roomId: string) {
    // Remove notifications from the store
    this.notificationStore.removeNotificationsByRoom(roomId);

    // Start the chat
    this.chatService.startChat(undefined, roomId);
  }

  setActiveTab(tab: 'messages' | 'requests', event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.activeTab === tab) return;
    this.activeTab = tab;
  }

  // Mark all messages as read
  markAllAsRead() {
    this.notificationService.clearNotifications();
    this.userService.clearAllUnreads().subscribe({
      next: (res) => {
        console.log('Unreads cleared:', res);
      },
      error: (err) => {
        console.error('Failed to clear unreads', err);
      },
    });
    this.notificationStore.clearAllMessages();

    // Close the dropdown
    this.setDropdownState(false);
  }

  async markRequestsAsRead() {
    console.log('MARK REQUESTS AS READ CALLED');

    // Get current friend requests from store
    const requests = await firstValueFrom(this.friendRequests$);

    // Process each request
    requests.forEach((r) => {
      const userId = r.fromUserId;
      if (!userId) return;

      // Pending requests are declined
      if (r.status === 'PENDING') {
        this.friendService.declineFriendRequest(userId).subscribe({
          error: (err) =>
            console.error('Failed to decline pending request for', userId, err),
        });
      } else {
        // Accepted or declined requests are cleared
        this.friendService.clearAcceptedDeclinedRequests(userId).subscribe({
          error: (err) =>
            console.error(
              'Failed to clear accepted/declined requests for',
              userId,
              err
            ),
        });
      }
    });

    this.notificationService.clearRequests();

    // Close dropdown
    this.setDropdownState(false);
  }
  // Close when clicking outside of the component
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showDropdown) return;
    const target = event.target as Node;
    const clickedInsideComponent = this.host.nativeElement.contains(target);
    const clickedInsideInlineHost =
      this.inlineHostElement?.contains(target as Node) ?? false;
    if (!clickedInsideComponent && !clickedInsideInlineHost) {
      this.setDropdownState(false);
    }
  }

  // Updates dropdown state and inline rendering
  private setDropdownState(state: boolean) {
    if (this.showDropdown === state) {
      this.dropdownChanged.emit(this.showDropdown);
      return;
    }
    this.showDropdown = state;
    this.syncInlineView();
    this.dropdownChanged.emit(this.showDropdown);
  }

  // Synchronizes inline rendering of the dropdown panel
  private syncInlineView() {
    if (!this.inlineHost) {
      if (this.inlineView) {
        this.inlineView.destroy();
        this.inlineView = undefined;
      }
      return;
    }

    if (!this.panelTemplate) return;

    if (this.showDropdown) {
      if (!this.inlineView) {
        this.inlineView = this.inlineHost.createEmbeddedView(
          this.panelTemplate,
          { inline: true }
        );
      }
      this.inlineView.detectChanges();
    } else if (this.inlineView) {
      this.inlineView.destroy();
      this.inlineView = undefined;
    }
  }
}
