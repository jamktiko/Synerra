import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BirthdayComponent } from './birthday/birthday.component';
import { UsernameComponent } from './username/username.component';
import { GamesComponent } from './games/games.component';

@Component({
  selector: 'app-profile-creation-page',
  templateUrl: './profile-creation-page.component.html',
  styleUrls: ['./profile-creation-page.component.css'],
})
export class ProfileCreationPageComponent {
  constructor(private modalService: NgbModal) {}

  async start() {
    try {
      // Step 1: Username
      const step1 = await this.modalService.open(UsernameComponent, {
        centered: true,
        size: 'lg',
      }).result;

      // Step 2: Birthday
      const birthdayModalRef = this.modalService.open(BirthdayComponent, {
        centered: true,
        size: 'lg',
      });
      birthdayModalRef.componentInstance.profile = step1;
      const step2 = await birthdayModalRef.result;

      // Step 3: Games
      const gamesModalRef = this.modalService.open(GamesComponent, {
        centered: true,
        size: 'lg',
      });
      gamesModalRef.componentInstance.profile = step2;
      const step3 = await gamesModalRef.result;

      console.log('Profile created:', step3);
      // send step3 to backend API for saving
    } catch (e) {
      if (e === 'back') {
        this.start(); // restart or handle back navigation
      }
      console.log('Modal closed/cancelled');
    }
  }
}
