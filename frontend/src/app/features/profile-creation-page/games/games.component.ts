import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-games',
  imports: [FormsModule],
  templateUrl: './games.component.html',
  styleUrl: './games.component.css',
})
export class GamesComponent {
  @Input() profile: any;
  constructor(private modalRef: NgbActiveModal) {}
  finish() {
    this.modalRef.close(this.profile);
  }
  back() {
    this.modalRef.dismiss('back');
  }
}
