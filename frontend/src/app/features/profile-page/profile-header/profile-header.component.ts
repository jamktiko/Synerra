import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../core/stores/user.store';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css',
})
export class ProfileHeaderComponent implements OnInit {
  user: User | null = null;
  showFullDescription = false;

  constructor(private userStore: UserStore) {}

  ngOnInit(): void {
    // Get current user from store
    this.user = this.userStore.user();
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  onEditProfile(): void {
    // TODO: Navigate to edit profile or open edit modal
    console.log('Edit profile clicked');
  }

  onUploadPhoto(): void {
    // TODO: Open file picker for profile picture
    console.log('Upload photo clicked');
  }
}
