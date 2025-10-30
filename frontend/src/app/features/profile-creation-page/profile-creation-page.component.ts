// Bootstrap modal
import { Component, effect, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BirthdayComponent } from './birthday/birthday.component';
import { UsernameComponent } from './username/username.component';
import { GamesComponent } from './games/games.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { User } from '../../core/interfaces/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserStore } from '../../core/stores/user.store';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-profile-creation-page',
  templateUrl: './profile-creation-page.component.html',
  styleUrls: ['./profile-creation-page.component.css'],
  imports: [ButtonComponent],
})
export class ProfileCreationPageComponent implements OnInit {
  profile: Partial<User> = {};
  currentStep: number = 0;

  constructor(
    private modalService: NgbModal,
    private userStore: UserStore,
    private authService: AuthService,
    private router: Router,
  ) {
    effect(() => {
      const user = this.userStore.user();
      if (user?.Username) {
        // If the user already has a username, they get thrown to the dashboardn (must not be able to create the profile again)
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngOnInit(): void {}

  logOut() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Modals step by steps controls the data being passed from modal to the next
  async start(step: number) {
    try {
      // Step 1: Username
      if (step === 1) {
        // The enter listener must immediately know that a modal is open (to prevent multiple simultanious modal renders)
        this.currentStep++;

        const usernameModalRef = this.modalService.open(UsernameComponent, {
          centered: true,
          size: 'lg',
        });
        usernameModalRef.componentInstance.profile = this.profile; // In case of going back to this modal, sending the current username
        await usernameModalRef.result;
        console.log(usernameModalRef.result);
        step++;
      }

      // Step 2: Birthday
      if (step === 2) {
        this.currentStep++;
        const birthdayModalRef = this.modalService.open(BirthdayComponent, {
          centered: true,
          size: 'lg',
        });
        birthdayModalRef.componentInstance.profile = this.profile;
        await birthdayModalRef.result;
        step++;
      }

      // Step 3: Games
      if (step === 3) {
        this.currentStep++;
        const gamesModalRef = this.modalService.open(GamesComponent, {
          centered: true,
          size: 'lg',
        });
        gamesModalRef.componentInstance.profile = this.profile;
        const step3 = await gamesModalRef.result;
        step++;

        console.log('Profile created:', step3);
        // send step3 to backend API for saving
      }
    } catch (e) {
      if (e === 'back') {
        this.start(step - 1);
        console.log('Modal closed/cancelled');
      } else {
        console.log('Modal process closed');
        step = 0;
        this.currentStep = 0;
      }
    }
  }

  @ViewChild('nextBtn', { read: ElementRef }) nextBtn!: ElementRef;

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    if (this.nextBtn?.nativeElement && this.currentStep < 1) {
      this.nextBtn.nativeElement.querySelector('app-button')?.click();
    }
  }
}
