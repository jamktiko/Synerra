import { Component } from '@angular/core';
import { ProfileService } from '../../../core/services/pfp.service';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent {
  selectedFile: File | null = null;
  uploadedUrl: string | null = null;
  uploadProgress: number | null = null;
  selectedFileName: string = '';
  previewUrl: string | null = '';

  constructor(private profileService: ProfileService) {}

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
        console.log('Upload response:', res);
        this.uploadedUrl = res.url;
        window.location.reload();
      },
      error: (err) => {
        console.error('Upload failed', err);
      },
    });
  }
}
