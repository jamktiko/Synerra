import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface User {
  name: string;
  avatar: string;
  lastMessage: string;
}

@Component({
  selector: 'app-social-menu',
  imports: [CommonModule],
  templateUrl: './social-menu.component.html',
  styleUrl: './social-menu.component.css',
})
export class SocialMenuComponent {
  activeTab: 'users' | 'groups' = 'users';
  users: User[] = [
    {
      name: 'Alice',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Hello there',
    },
    {
      name: 'Bob',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Last message',
    },
    { name: 'Charlie', avatar: 'assets/svg/Acount.svg', lastMessage: 'Yo!' },
    {
      name: 'David',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'What’s up?',
    },
    {
      name: 'Eve',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Good morning',
    },
    {
      name: 'Frank',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Check this out',
    },
    {
      name: 'Grace',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'See you soon',
    },
    { name: 'Hannah', avatar: 'assets/svg/Acount.svg', lastMessage: 'LOL' },
    { name: 'Isaac', avatar: 'assets/svg/Acount.svg', lastMessage: 'Thanks!' },
    {
      name: 'Jack',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Sure thing',
    },
    {
      name: 'Karen',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'On my way',
    },
    { name: 'Leo', avatar: 'assets/svg/Acount.svg', lastMessage: 'Cool' },
    { name: 'Mia', avatar: 'assets/svg/Acount.svg', lastMessage: 'See ya' },
    {
      name: 'Nora',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Interesting',
    },
    { name: 'Oscar', avatar: 'assets/svg/Acount.svg', lastMessage: 'Nice!' },
    { name: 'Pam', avatar: 'assets/svg/Acount.svg', lastMessage: 'Got it' },
    { name: 'Quinn', avatar: 'assets/svg/Acount.svg', lastMessage: 'Hello!' },
    { name: 'Ralph', avatar: 'assets/svg/Acount.svg', lastMessage: 'Hi there' },
    {
      name: 'Sophia',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Good night',
    },
    { name: 'Tom', avatar: 'assets/svg/Acount.svg', lastMessage: 'Bye!' },
    {
      name: 'Uma',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'See you later',
    },
    {
      name: 'Victor',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Cool beans',
    },
    { name: 'Wendy', avatar: 'assets/svg/Acount.svg', lastMessage: 'Alright' },
    { name: 'Xander', avatar: 'assets/svg/Acount.svg', lastMessage: 'Yo yo' },
    {
      name: 'Yara',
      avatar: 'assets/svg/Acount.svg',
      lastMessage: 'Thanks a lot',
    },
    { name: 'Zane', avatar: 'assets/svg/Acount.svg', lastMessage: 'Peace' },
  ];

  rooms: User[] = [
    { name: 'Room 1', avatar: 'assets/svg/Acount.svg', lastMessage: '' },
    { name: 'Room 2', avatar: 'assets/svg/Acount.svg', lastMessage: '' },
  ];
}
