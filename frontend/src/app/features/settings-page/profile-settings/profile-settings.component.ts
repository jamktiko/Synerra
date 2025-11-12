import { Component } from '@angular/core';
import { ProfileService } from '../../../core/services/pfp.service';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/interfaces/user.model';
import { OnInit } from '@angular/core';
import { UserStore } from '../../../core/stores/user.store';
import { FormsModule } from '@angular/forms';
import { Language } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent implements OnInit {
  selectedFile: File | null = null;
  uploadedUrl: string | null = null;
  uploadProgress: number | null = null;
  selectedFileName: string = '';
  previewUrl: string | null = '';
  user: User | null = {};
  selectedLanguages: string[] = [];
  playstyle: string = '';
  notificationMessage: string = '';
  showNotification: boolean = false;
  usernameTaken: boolean = false;
  validUsername: boolean = true;
  username: string = '';
  bio: string = '';
  availablePlatforms: string[] = ['PC', 'PlayStation', 'Xbox', 'Mobile']; // platforms to choose from
  selectedPlatforms: string[] = [];

  // languages to select from
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
    this.user = this.userStore.getUser(); // get the logged in user for user info

    // get current values to display initially
    this.username = this.user?.Username ?? '';
    this.bio = this.user?.Bio ?? '';
    this.playstyle = this.user?.Playstyle ?? '';
    console.log(this.playstyle);

    this.selectedPlatforms = Array.isArray(this.user?.Platform)
      ? [...this.user.Platform]
      : [];
    // Convert array to comma-separated string
    this.selectedLanguages = Array.isArray(this.user?.Languages)
      ? [...this.user.Languages]
      : [];
  }

  // when the image file is selected
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string; // preview url to preview the image
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.previewUrl = null;
    }
  }

  // this function uploads the image to backend (lambda => S3 => S3 url to DynamoDb)
  upload() {
    if (!this.selectedFile) return;

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('Upload response:', res);
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
    this.validUsername = pattern.test(this.username);
    this.usernameTaken = false; // clear backend error message while typing
  }
  // save username and send it to backend for update
  saveUsername() {
    if (!this.user || !this.user.UserId) return;

    this.userService
      .updateUser(this.user.UserId, { username: this.username })
      .subscribe({
        next: () => this.showPopUp('Username updated successfully!'), // pop up message on success
        error: (err) => {
          console.error('Update failed', err);
          this.showPopUp('Failed to update username.');
        },
      });
  }

  //save bio text and send it to backend for update
  saveBio() {
    if (!this.user || !this.user.UserId) return;

    this.userService.updateUser(this.user.UserId, { bio: this.bio }).subscribe({
      next: () => this.showPopUp('Bio updated successfully!'),
      error: (err) => {
        console.error('Update failed', err);
        this.showPopUp('Failed to update bio.');
      },
    });
  }

  // when language is selected, push it to selectedLanguages array
  toggleLanguage(code: string) {
    if (this.selectedLanguages.includes(code)) {
      this.selectedLanguages = this.selectedLanguages.filter((c) => c !== code);
    } else {
      this.selectedLanguages.push(code);
    }
  }

  // saves the languages and sends it to backend for update
  saveLanguages() {
    if (!this.user || !this.user.UserId) return;

    this.userService
      .updateUser(this.user.UserId, { languages: this.selectedLanguages })
      .subscribe({
        next: () => this.showPopUp('Languages updated successfully!'),
        error: (err) => {
          console.error('Update failed', err);
          this.showPopUp('Failed to update languages.');
        },
      });
  }
  // gets the language names for display rather than the language code
  get selectedLanguageNames(): string[] {
    return this.selectedLanguages
      .map((code) => this.languages.find((l) => l.code === code)?.name)
      .filter((name): name is string => !!name);
  }

  // when platform is selected push it to selectedPlatforms array
  togglePlatform(platform: string) {
    if (this.selectedPlatforms.includes(platform)) {
      this.selectedPlatforms = this.selectedPlatforms.filter(
        (p) => p !== platform
      );
    } else {
      this.selectedPlatforms.push(platform);
    }
  }

  // saves the playstyle and platform and sends it to backend for update
  savePlaystyleAndPlatform() {
    if (!this.user || !this.user.UserId) return;

    const data = {
      playstyle: this.playstyle,
      platform: this.selectedPlatforms,
    };

    console.log('DATAA: ', data);

    this.userService.updateUser(this.user.UserId, data).subscribe({
      next: () =>
        this.showPopUp('Playstyle and platforms updated successfully!'),
      error: (err) => {
        console.error('Update failed', err);
        this.showPopUp('Failed to update playstyle/platform.');
      },
    });
  }

  // toggless the pop up for appearance
  showPopUp(message: string, duration: number = 3000) {
    this.notificationMessage = message;
    this.showNotification = true;

    setTimeout(() => {
      this.showNotification = false;
      this.notificationMessage = '';
    }, duration);
  }
  validateUsername() {
    // First check local format rule
    if (!this.validUsername) {
      this.showPopUp(
        'Username must be 3-20 characters (letters, numbers, underscores).'
      );
      return;
    }

    // Request backend to check availability
    this.userService.getUserByUsername(this.username).subscribe({
      next: (res) => {
        // Check if returned users contain someone other than the logged-in user
        const taken = res?.users?.some(
          (u: any) => u.UserId !== this.user?.UserId
        );

        if (taken) {
          this.usernameTaken = true;
          this.showPopUp('Username is already taken.');
        } else {
          this.usernameTaken = false;
          this.saveUsername(); // username is valid and available
        }
      },
      error: (err) => {
        console.error('Username validation failed:', err);
        this.showPopUp('Could not validate username.');
      },
    });
  }
}
