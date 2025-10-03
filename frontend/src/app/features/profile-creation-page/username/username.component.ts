import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Output, EventEmitter } from '@angular/core';
import { User } from '../../../core/interfaces/user.model';

@Component({
  selector: 'app-username',
  imports: [FormsModule, ButtonComponent],
  templateUrl: './username.component.html',
  styleUrl: './username.component.css',
})
export class UsernameComponent {
  profile: any = {};
  username: string = '';
  // Output for the profileUpdate so that it can be used in the next modal too
  @Output() profileUpdate = new EventEmitter<Partial<User>>();
  constructor(private modalRef: NgbActiveModal) {}
  next() {
    this.saveUsername();
    // Save username into profile object
    this.profile.Username = this.username;

    // Close modal and pass full profile to parent
    this.modalRef.close(this.profile);
  }
  saveUsername() {
    // Emit only the username field
    this.profileUpdate.emit({ Username: this.username });
    console.log(this.username);
  }
}
