import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { User } from '../../core/interfaces/user.model'; // add if you have a model
import { PlayerCardComponent } from './player-card/player-card.component';

@Component({
  selector: 'app-find-players',
  standalone: true, // only if you want to use imports array
  imports: [CommonModule, PlayerCardComponent],
  templateUrl: './find-players.component.html',
  styleUrls: ['./find-players.component.css'],
})
export class FindPlayersComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.users;
        console.log('Users:', res.users);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
    });
  }
}
