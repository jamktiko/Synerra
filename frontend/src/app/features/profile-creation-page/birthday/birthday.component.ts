import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
export class BirthdayComponent implements OnInit {
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
    { code: 'fi', name: 'Finnish' },
    { code: 'sv', name: 'Swedish' },
  ];
  // Acts as the current selected bday
  selectedBirthday: string | null = null;

  selectedLanguages: string[] = [];

  ngOnInit() {
    // If the profile.birthday is Date, set selectedBirthday as a string of that date
    if (this.profile.Birthday instanceof Date && this.profile.Birthday) {
      // A quick AI conversion to get the string date in the right form
      const yyyy = this.profile.Birthday.getFullYear();
      const mm = String(this.profile.Birthday.getMonth() + 1).padStart(2, '0');
      const dd = String(this.profile.Birthday.getDate()).padStart(2, '0');
      this.selectedBirthday = `${yyyy}-${mm}-${dd}`;
    }

    if (this.profile?.Languages?.length) {
      this.selectedLanguages = [...this.profile.Languages];
    }
  }

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

  get hasDate(): boolean {
    // true when date has been selected in the date input
    return !!this.selectedBirthday; // converts the value: boolean
  }

  get canProceed(): boolean {
    // True ONLY if date is selected & at least one language is selected
    return this.hasDate && this.selectedLanguages.length > 0;
  }

  next() {
    // Add birthday and languages to profile
    // Convert string to Date if necessary
    if (typeof this.selectedBirthday === 'string' && this.selectedBirthday) {
      this.profile.Birthday = new Date(this.selectedBirthday);
    }
    this.profile.Languages = [...this.selectedLanguages];
    console.log(this.profile);
    this.profileUpdate.emit(this.profile);
    this.modalRef.close(this.profile);
  }

  back() {
    this.modalRef.dismiss('back');
  }

  // Same enter-key check as in the username component
  @ViewChild('nextBtn', { read: ElementRef }) nextBtn!: ElementRef;

  handleEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      this.nextBtn.nativeElement.click();
    }
    keyboardEvent.preventDefault();
  }
}
