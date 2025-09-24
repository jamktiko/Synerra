import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-birthday',
  imports: [FormsModule],
  templateUrl: './birthday.component.html',
  styleUrl: './birthday.component.css',
})
export class BirthdayComponent {
  @Input() profile: any;
  constructor(private modalRef: NgbActiveModal) {}
  next() {
    this.modalRef.close(this.profile);
  }
  back() {
    this.modalRef.dismiss('back');
  }
}
