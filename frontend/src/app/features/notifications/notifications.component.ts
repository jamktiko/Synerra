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
  imports: [CommonModule],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  unreads: UnreadMessage[] = [];
  pendingRequests: FriendRequest[] = [];
  notifications: any[] = [];

  showDropdown = false;
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
    this.sub = this.notificationService.notifications$.subscribe((data) => {
      console.log('Received notification in component:', data);
      this.notifications.push(data);
      console.log(this.notifications);
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

  // Starts chat when clicking notification and removes notifications from that sender
  userClicked(userId: string) {
    this.notifications = this.notifications.filter((n) => {
      const senderId = n.senderId || n.senderID || n.fromUserId || n.SenderId;
      return senderId !== userId;
    });
    this.chatService.startChat([userId]);
  }

  // Mark all messages as read
  markAllAsRead() {
    if (!this.unreads?.length) return;
    const roomIds = Array.from(new Set(this.unreads.map((m) => m.RoomId)));
    // Best-effort: fire requests and refresh; ignore individual failures
    roomIds.forEach((roomId) => {
      this.userService.markRoomMessagesAsRead(roomId).subscribe({
        error: (err) => console.error('Failed to mark room read', roomId, err),
      });
    });
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
