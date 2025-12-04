import { CommonModule } from '@angular/common';
import { Component, input, signal, WritableSignal } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/interfaces/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-messages-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './messages-tab.component.html',
  styleUrl: './messages-tab.component.css',
})
export class MessagesTabComponent {
  friendsList = input<any[]>([]);
  directChats = input<any[]>([]);
  groupChats = input<any[]>([]);
  groupChatsLocal!: WritableSignal<any[]>; // local signal for instant ui updates when leaving rooms
  newChatModalOpen: boolean = false;
  selectedFriends: User[] = [];

  activeTab: 'friends' | 'chats' | 'groupChats' = 'friends';

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.groupChatsLocal = signal(this.groupChats());
  }
  userClicked(userId: string) {
    this.chatService.startChat([userId]);
  }

  groupChatClicked(roomId: string) {
    this.chatService.startChat(undefined, roomId);
  }

  openProfile(userId: string, event: MouseEvent) {
    this.router.navigate([`/dashboard/profile/${userId}`]);
  }

  openNewChatModal() {
    this.newChatModalOpen = true;
  }

  closeNewChatModal() {
    this.newChatModalOpen = false;
    this.selectedFriends = [];
  }

  // Logic for selecting friends in the modal
  toggleFriendSelection(friend: User) {
    if (this.isSelected(friend)) {
      // Remove if already selected
      this.selectedFriends = this.selectedFriends.filter(
        (f) => f.UserId !== friend.UserId
      );
    } else {
      // Add to selected
      this.selectedFriends.push(friend);
    }
  }

  isSelected(friend: User): boolean {
    return this.selectedFriends.some((f) => f.UserId === friend.UserId);
  }

  startChat() {
    const selectedUserIds: string[] = this.selectedFriends
      .map((f) => f.UserId)
      .filter((id): id is string => !!id); // Filters undefined(s)

    if (selectedUserIds.length === 0) return;

    // Starts the chat with chosen userIds
    this.chatService.startChat(selectedUserIds);
    this.closeNewChatModal();
  }

  //leave groupchat room
  leaveRoom(roomId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to leave this chat room?'
    ); // user needs to confirm the action
    if (!confirmed) return;

    //calls the user service function for backend delete call
    this.userService.leaveRoom(roomId).subscribe({
      next: () => {
        // mutate local writable signal
        this.groupChatsLocal.update((list) =>
          list.filter((r) => r.RoomId !== roomId)
        );
      },
      error: (err) => console.error(err),
    });
  }
}
