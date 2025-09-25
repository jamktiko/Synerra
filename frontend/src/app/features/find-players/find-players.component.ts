import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service'; // adjust path
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-find-players',
  imports: [CommonModule],
  templateUrl: './find-players.component.html',
  styleUrl: './find-players.component.css',
})
export class FindPlayersComponent implements OnInit {
  users: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res; // store users for template
        console.log('Users:', res);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
    });
  }
}
