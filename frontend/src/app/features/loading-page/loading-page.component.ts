import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-page',
  imports: [ButtonComponent, CommonModule],
  templateUrl: './loading-page.component.html',
  styleUrl: './loading-page.component.css',
})
export class LoadingPageComponent implements OnInit {
  goToLoginPageButtonShowing = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.goToLoginPageButtonShowing = true;
    }, 3000);
  }

  goToLogin() {
    this.router.navigate(['/login']);
    this.authService.logout();
  }
}
