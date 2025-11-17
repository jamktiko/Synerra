import { Component } from '@angular/core';
import { ProfileService } from '../../../core/services/pfp.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/interfaces/user.model';
import { OnInit } from '@angular/core';
import { UserStore } from '../../../core/stores/user.store';
import { FormsModule } from '@angular/forms';
import { Language } from '../../../core/interfaces/user.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';

type FeedbackSection = 'username' | 'bio' | 'languages' | 'playstyle';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  selectedFile: File | null = null;
  uploadedUrl: string | null = null;
  uploadProgress: number | null = null;
  selectedFileName = '';
  previewUrl: string | null = '';
  user: User | null = null;
  selectedLanguages: string[] = [];
  playstyle = '';
  usernameTaken = false;
  validUsername = true;
  username = '';
  bio = '';
  availablePlatforms: string[] = ['PC', 'PlayStation', 'Xbox', 'Mobile'];
  selectedPlatforms: string[] = [];
  feedbackMessages: Record<FeedbackSection, string> = {
    username: '',
    bio: '',
    languages: '',
    playstyle: '',
  };

  private feedbackTimeouts: Partial<Record<FeedbackSection, number>> = {};

  languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'fi', name: 'Finnish' },
    { code: 'sv', name: 'Swedish' },
  ];

  constructor(
    private profileService: ProfileService,
    private userService: UserService,
    private userStore: UserStore
  ) {}

  ngOnInit(): void {
    this.user = this.userStore.getUser();
    this.username = this.user?.Username ?? '';
    this.bio = this.user?.Bio ?? '';
    this.playstyle = this.user?.Playstyle ?? '';
    this.selectedPlatforms = Array.isArray(this.user?.Platform)
      ? [...this.user.Platform]
      : [];
    this.selectedLanguages = Array.isArray(this.user?.Languages)
      ? [...this.user.Languages]
      : [];
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.previewUrl = null;
    }
  }

  upload() {
    if (!this.selectedFile) return;

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (res: any) => {
        this.uploadedUrl = res.url;
        window.location.reload();
      },
      error: (err) => {
        console.error('Upload failed', err);
      },
    });
  }

  onUsernameInput() {
    const pattern = /^[A-Za-z0-9_]{3,20}$/;
    const value = this.username.trim();
    this.validUsername = pattern.test(value);
    console.log('ONKO VALIDI', this.validUsername);
    this.usernameTaken = false;
  }

  saveUsername() {
    if (!this.user?.UserId) return;

    this.userService
      .updateUser(this.user.UserId, { username: this.username })
      .subscribe({
        next: () => this.setFeedback('username', 'Username updated successfully.'),
        error: () => this.setFeedback('username', 'Failed to update username.'),
      });
  }

  saveBio() {
    if (!this.user?.UserId) return;

    this.userService.updateUser(this.user.UserId, { bio: this.bio }).subscribe({
      next: () => this.setFeedback('bio', 'Bio updated successfully.'),
      error: () => this.setFeedback('bio', 'Failed to update bio.'),
    });
  }

  toggleLanguage(code: string) {
    if (this.selectedLanguages.includes(code)) {
      this.selectedLanguages = this.selectedLanguages.filter((c) => c !== code);
    } else {
      this.selectedLanguages.push(code);
    }
  }

  saveLanguages() {
    if (!this.user?.UserId) return;

    this.userService
      .updateUser(this.user.UserId, { languages: this.selectedLanguages })
      .subscribe({
        next: () => this.setFeedback('languages', 'Languages updated successfully.'),
        error: () => this.setFeedback('languages', 'Failed to update languages.'),
      });
  }

  togglePlatform(platform: string) {
    if (this.selectedPlatforms.includes(platform)) {
      this.selectedPlatforms = this.selectedPlatforms.filter((p) => p !== platform);
    } else {
      this.selectedPlatforms.push(platform);
    }
  }

  savePlaystyleAndPlatform() {
    if (!this.user?.UserId) return;

    const payload = {
      playstyle: this.playstyle,
      platform: this.selectedPlatforms,
    };

    this.userService.updateUser(this.user.UserId, payload).subscribe({
      next: () =>
        this.setFeedback(
          'playstyle',
          'Playstyle and platforms updated successfully.'
        ),
      error: () =>
        this.setFeedback('playstyle', 'Failed to update playstyle/platform.'),
    });
  }

  saveIdentity(): void {
    this.validateUsername();
    this.saveBio();
  }

  validateUsername() {
    if (!this.validUsername) {
      this.setFeedback(
        'username',
        'Username must be 3-20 characters (letters, numbers, underscores).'
      );
      return;
    }

    this.userService.getUserByUsername(this.username).subscribe({
      next: (res) => {
        const taken = res?.users?.some((u: any) => u.UserId !== this.user?.UserId);
        if (taken) {
          this.usernameTaken = true;
          this.setFeedback('username', 'Username is already taken.');
        } else {
          this.usernameTaken = false;
          this.saveUsername();
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.usernameTaken = false;
          this.saveUsername();
          return;
        }
        console.error('Username validation failed:', err);
        this.setFeedback('username', 'Could not validate username.');
      },
    });
  }

  private setFeedback(section: FeedbackSection, message: string): void {
    this.feedbackMessages[section] = message;
    const timeout = this.feedbackTimeouts[section];
    if (timeout) {
      window.clearTimeout(timeout);
    }
    this.feedbackTimeouts[section] = window.setTimeout(() => {
      this.feedbackMessages[section] = '';
      delete this.feedbackTimeouts[section];
    }, 3500);
  }
}
