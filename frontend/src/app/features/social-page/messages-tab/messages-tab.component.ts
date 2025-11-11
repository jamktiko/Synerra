import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FriendService } from '../../../core/services/friend.service';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-messages-tab',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './messages-tab.component.html',
  styleUrl: './messages-tab.component.css',
})
export class MessagesTabComponent implements OnInit {
  directChats = input<any[]>([]);
  groupChats = input<any[]>([]);
  newChatModalOpen: boolean = false;
  friendsList: User[] | null = null;
  selectedFriends: User[] = [];

  activeTab: 'users' | 'groups' = 'users';

  constructor(
    private chatService: ChatService,
    private friendService: FriendService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Getting friends for the modal
    this.friendService.getFriends().subscribe({
      next: (friends) => {
        this.friendsList = friends;
      },
      error: (err) => console.error('Error loading friends:', err),
    });
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
        (f) => f.UserId !== friend.UserId,
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
}
