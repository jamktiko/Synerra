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
import { Subscription } from 'rxjs';

import { UnreadMessage } from '../../core/interfaces/chatMessage';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';

import { UserService } from '../../core/services/user.service';
import { ChatService } from '../../core/services/chat.service';
import { FriendService } from '../../core/services/friend.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [CommonModule, ButtonComponent],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  unreads: UnreadMessage[] = [];
  pendingRequests: FriendRequest[] = [];
  notifications: any[] = [];

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
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    // Listens to friend requests
    this.friendService.pendingRequests$.subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        console.log('Pending friend requests:', this.pendingRequests);
      },
      error: (err) => console.error('Failed to load pending requests', err),
    });

    // Listens to unread messages
    this.userService.unreads$.subscribe({
      next: (messages) => {
        // Filter out friend requests
        this.unreads = messages.filter(
          (msg) => msg.Relation !== 'FRIEND_REQUEST'
        );
        console.log('Unread messages:', this.unreads);
      },
      error: (err) => console.error('Failed to load unread messages', err),
    });

    // Fetch initial data
    this.userService.getUnreadMessages().subscribe();
    this.friendService.getPendingRequests().subscribe();
    this.userService.fetchUnreadMessages();

    // Subscribe to incoming notifications
    this.sub = this.notificationService.notifications$.subscribe(
      (data: any) => {
        switch (data.type) {
          case 'CLEAR_ALL_MESSAGES':
            this.notifications = this.notifications.filter(
              (n) => n.type !== 'newMessage'
            );
            break;
          case 'CLEAR_ALL_REQUESTS':
            this.notifications = this.notifications.filter(
              (n) =>
                n.type !== 'friend_request' &&
                n.type !== 'friend_request_accepted' &&
                n.type !== 'friend_request_declined'
            );
            break;
          default:
            // push normal notifications (messages, friend requests, etc.)
            this.notifications.push(data);
        }
      }
    );
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

  // Accept friend request
  acceptRequest(targetUserId: string) {
    const request = this.pendingRequests.find(
      (req) => req.PK === `USER#${targetUserId}`
    );
    const username = request?.SenderUsername || 'User';

    this.friendService.acceptFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
        alert(`Friend request from ${username} accepted`);
      },
      error: (err) => console.error('Failed to accept request', err),
    });
  }

  // Decline friend request
  declineRequest(targetUserId: string) {
    const request = this.pendingRequests.find(
      (req) => req.PK === `USER#${targetUserId}`
    );
    const username = request?.SenderUsername || 'User';

    this.friendService.declineFriendRequest(targetUserId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(
          (req) => req.PK !== `USER#${targetUserId}`
        );
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
      },
      error: (err) => {
        console.error('Failed to clear requests', err);
        alert('Failed to clear requests. Check console for details.');
      },
    });

    // Remove notifications from this sender
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
      return senderId !== userId;
    });

    // Remove requests from local list
    this.pendingRequests = this.pendingRequests.filter(
      (req) => req.SenderId !== userId && req.PK !== `USER#${userId}`
    );

    console.log(`Cleared requests from user ${userId}`);
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.setDropdownState(!this.showDropdown);
  }

  // Badge count for total unread notifications, messages and requests
  get unreadCount(): number {
    return (
      (this.unreads?.length || 0) +
      (this.pendingRequests?.length || 0) +
      (this.notifications?.length || 0)
    );
  }

  get messageNotifications() {
    return this.notifications.filter((n) => n.type === 'newMessage');
  }

  get friendRequestNotifications() {
    return this.notifications.filter(
      (n) =>
        n.type === 'friend_request' ||
        n.type === 'friend_request_accepted' ||
        n.type === 'friend_request_declined'
    );
  }

  get messageTabCount(): number {
    return (this.unreads?.length || 0) + this.messageNotifications.length;
  }

  get requestTabCount(): number {
    return (
      (this.pendingRequests?.length || 0) +
      this.friendRequestNotifications.length
    );
  }

  // Starts chat when clicking notification and removes notifications from that sender
  userClicked(roomId: string) {
    // Also remove from the generic notifications list
    this.notifications = this.notifications.filter((n) => n.roomId !== roomId);

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
    // Normalize reactive notifications
    const reactiveMessages = this.notifications
      .filter((n) => n.type === 'newMessage')
      .map((n) => ({
        roomId: n.roomId,
      }));

    // Normalize database messages
    const dbMessages = this.unreads.map((n) => ({
      roomId: n.RoomId,
    }));

    // Merge and deduplicate by roomId
    const uniqueRoomIds = Array.from(
      new Set([...reactiveMessages, ...dbMessages].map((m) => m.roomId))
    );

    // Mark each room as read on the backend
    uniqueRoomIds.forEach((roomId) => {
      this.userService.markRoomMessagesAsRead(roomId).subscribe({
        error: (err) => console.error('Failed to mark room read', roomId, err),
      });
    });

    // Clear notifications and unreads locally
    this.notifications = this.notifications.filter(
      (n) => n.type !== 'newMessage'
    );
    this.unreads = [];
    this.notificationService.clearNotifications();
    this.userService.clearAllUnreads();

    // Close the dropdown
    this.setDropdownState(false);
  }

  markRequestsAsRead() {
    console.log('MARK REQUESTS AS READ CALLED');

    // Normalize reactive notifications
    const reactiveRequests = this.notifications
      .filter((n) => n.type === 'friend_request')
      .map((n) => ({
        userId: n.fromUserId,
        status: 'PENDING',
        username: n.fromUsername,
        picture: n.fromPicture,
      }));

    // Normalize DB pending requests
    const dbRequests = this.pendingRequests.map((req) => ({
      userId: req.SenderId,
      status: req.Status, // PENDING / ACCEPTED / DECLINED
      username: req.SenderUsername,
      picture: req.SenderPicture,
    }));

    // Merge and deduplicate by userId
    const allRequestsMap = new Map<
      string,
      { userId: string; status: string }
    >();
    [...reactiveRequests, ...dbRequests].forEach((r) => {
      if (!allRequestsMap.has(r.userId)) {
        allRequestsMap.set(r.userId, { userId: r.userId, status: r.status });
      }
    });
    const uniqueRequests = Array.from(allRequestsMap.values());

    console.log('Unique requests to process:', uniqueRequests);

    // Process requests
    uniqueRequests.forEach(({ userId, status }) => {
      if (!userId) return;

      if (status === 'PENDING') {
        // Pending requests are declined
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

    // Clear UI arrays
    this.notifications = this.notifications.filter(
      (n) => n.type !== 'friend_request'
    );
    this.notificationService.clearRequests();
    this.pendingRequests = [];
    this.friendService.clearAllRequests();

    //  Close dropdown
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
