import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-username',
  imports: [FormsModule],
  templateUrl: './username.component.html',
  styleUrl: './username.component.css',
})
export class UsernameComponent {
  profile: any = {};
  constructor(private modalRef: NgbActiveModal) {}
  next() {
    this.modalRef.close(this.profile);
  }
}
