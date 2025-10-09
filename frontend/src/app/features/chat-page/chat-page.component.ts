import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocialBarComponent } from '../social-bar/social-bar.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-chat-page',
  imports: [ChatComponent],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
})
export class ChatPageComponent {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
  }
}
