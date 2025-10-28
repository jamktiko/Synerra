import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Output, EventEmitter } from '@angular/core';
import { User } from '../../../core/interfaces/user.model';
import { UserService } from '../../../core/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-username',
  imports: [FormsModule, ButtonComponent, CommonModule],
  templateUrl: './username.component.html',
  styleUrl: './username.component.css',
})
export class UsernameComponent {
  profile: any = {};
  username: string = '';
  errorText = false; // The error text
  validUsername = false;

  // Output for the profileUpdate so that it can be used in the next modal too
  @Output() profileUpdate = new EventEmitter<Partial<User>>();
  constructor(
    private modalRef: NgbActiveModal,
    private userService: UserService,
  ) {}
  constructor(private modalRef: NgbActiveModal) {}

  onUsernameInput() {
    const valid = /^[A-Za-z0-9_]{3,20}$/; //checks chars + numbers -> button disabled
    this.validUsername = valid.test(this.username);

    this.errorText = false;
  }

  usernameTaken() {
    // fake data, saa siis poistaa tän :D
    const takenUsernames = [
      'admin',
      'test',
      'user',
      'karhukoira',
      'mayrakoira',
    ];

    // is the username available
    if (takenUsernames.includes(this.username)) {
      this.errorText = true; // error visible
      this.validUsername = false; // cant proceed to birthday
      console.log('username is taken');
    } else {
      this.errorText = false;
    }
  }

  next() {
    this.userService.getUserByUsername(this.username).subscribe({
      next: (res) => {
        if (res.users && res.users.length > 0) {
          console.log('nimi on otettu');
          return;
        }

        this.saveUsername();

        // Save username into profile object
        this.profile.Username = this.username;
        this.usernameTaken(); // checks is the username available

        // blocks progress
        if (!this.validUsername || this.errorText) {
          return;
        }

        this.saveUsername();
        // Save username into profile object
        this.profile.Username = this.username;

        // Close modal and pass full profile to parent
        this.modalRef.close(this.profile);
      },
    });
  }
  saveUsername() {
    // Emit only the username field
    this.profileUpdate.emit({ Username: this.username });
    console.log(this.username);
  }
}
