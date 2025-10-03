import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { User, Country, Language } from '../../../core/interfaces/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-birthday',
  imports: [FormsModule, ButtonComponent, NgbDropdownModule, CommonModule],
  templateUrl: './birthday.component.html',
  styleUrl: './birthday.component.css',
})
export class BirthdayComponent {
  //Input so that it gets the profile data from the previous modal
  @Input() profile: Partial<User> = {};
  // Output for the profileUpdate so that it can be used in the next modal too
  @Output() profileUpdate = new EventEmitter<Partial<User>>();
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
  ];
  selectedLanguages: string[] = [];

  constructor(private modalRef: NgbActiveModal) {}

  // Called when a checkbox is toggled
  toggleLanguage(event: Event, lang: string) {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;

    if (input.checked) {
      if (!this.selectedLanguages.includes(lang)) {
        this.selectedLanguages.push(lang);
      }
    } else {
      this.selectedLanguages = this.selectedLanguages.filter((l) => l !== lang);
    }
  }

  next() {
    // Add birthday and languages to profile
    // Convert string to Date if necessary
    if (typeof this.profile.Birthday === 'string' && this.profile.Birthday) {
      this.profile.Birthday = new Date(this.profile.Birthday);
    }
    this.profile.Languages = [...this.selectedLanguages];
    console.log(this.profile);
    this.profileUpdate.emit(this.profile);
    this.modalRef.close(this.profile);
  }

  back() {
    this.modalRef.dismiss('back');
  }
}
