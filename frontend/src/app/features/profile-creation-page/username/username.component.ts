import { Component, Input, OnInit } from '@angular/core';
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
export class UsernameComponent implements OnInit {
  errorText = false; // The error text
  validUsername = false;

  @Input() profile: Partial<User> = {};
  username: string = '';

  // Output for the profileUpdate so that it can be used in the next modal too
  @Output() profileUpdate = new EventEmitter<Partial<User>>();
  constructor(
    private modalRef: NgbActiveModal,
    private userService: UserService,
  ) {}

  ngOnInit() {
    if (this.profile?.Username) {
      this.username = this.profile.Username;
      this.validUsername = true;
    }
  }

  onUsernameInput() {
    const valid = /^[A-Za-z0-9_]{3,20}$/; //checks chars + numbers -> button disabled
    this.validUsername = valid.test(this.username);
    this.errorText = false;
  }

  next() {
    this.userService.getUserByUsername(this.username).subscribe({
      next: (res) => {
        if (res.users && res.users.length > 0) {
          this.errorText = true; // error visible
          this.validUsername = false; // cant proceed to birthday
          console.warn('Username taken');
          return;
        }
      },
      error: (err) => {
        this.saveUsername();

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
  closeModal() {
    this.modalRef.dismiss();
  }
}
