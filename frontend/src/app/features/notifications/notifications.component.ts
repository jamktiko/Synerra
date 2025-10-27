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
import { UnreadMessage } from '../../core/interfaces/chatMessage';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { FriendService } from '../../core/services/friend.service';
import { FriendRequest } from '../../core/interfaces/friendrequest.model';
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [CommonModule],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  unreads: UnreadMessage[] = [];
  pendingRequests: FriendRequest[] = [];
  showDropdown = false;
  readonly dropdownContext = { inline: false };

  @ViewChild('panelTemplate') panelTemplate!: TemplateRef<{ inline: boolean }>;

  private inlineView?: EmbeddedViewRef<{ inline: boolean }>;
  private _inlineHost?: ViewContainerRef;

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
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    // Kuuntele friend requests
    this.friendService.pendingRequests$.subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        console.log('Pending friend requests:', this.pendingRequests);
      },
      error: (err) => console.error('Failed to load pending requests', err),
    });

    // Kuuntele unread messages
    this.userService.unreads$.subscribe({
      next: (messages) => {
        // suodatetaan FRIEND_REQUESTit pois
        this.unreads = messages.filter(
          (msg) => msg.Relation !== 'FRIEND_REQUEST'
        );
        console.log('Unread messages:', this.unreads);
      },
      error: (err) => console.error('Failed to load unread messages', err),
    });

    // Pyydetään aluksi palvelimelta tiedot
    this.userService.getUnreadMessages().subscribe();
    this.friendService.getPendingRequests().subscribe();
  }

  ngOnDestroy(): void {
    if (this.inlineView) {
      this.inlineView.destroy();
      this.inlineView = undefined;
    }
  }

  // hyväksy friend request
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

  // hylkää friend request
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

  // toggle dropdown
  toggleDropdown() {
    this.setDropdownState(!this.showDropdown);
  }

  // badge-lukumäärä
  get unreadCount(): number {
    return (this.unreads?.length || 0) + (this.pendingRequests?.length || 0);
  }

  // aloittaa chatin kun klikkaa notifikaatiota
  userClicked(userId: string) {
    this.chatService.startChat([userId]);
  }

  // merkitse kaikki viestit luetuiksi
  markAllAsRead() {
    if (!this.unreads?.length) return;
    const roomIds = Array.from(new Set(this.unreads.map((m) => m.RoomId)));
    // Best-effort: fire requests and refresh; ignore individual failures here
    roomIds.forEach((roomId) => {
      this.userService.markRoomMessagesAsRead(roomId).subscribe({
        error: (err) => console.error('Failed to mark room read', roomId, err),
      });
    });
    this.setDropdownState(false);
  }

  // close when clicking outside of the component
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

  private setDropdownState(state: boolean) {
    if (this.showDropdown === state) {
      this.dropdownChanged.emit(this.showDropdown);
      return;
    }
    this.showDropdown = state;
    this.syncInlineView();
    this.dropdownChanged.emit(this.showDropdown);
  }

  private syncInlineView() {
    if (!this.inlineHost) {
      if (this.inlineView) {
        this.inlineView.destroy();
        this.inlineView = undefined;
      }
      return;
    }

    if (!this.panelTemplate) {
      return;
    }

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
