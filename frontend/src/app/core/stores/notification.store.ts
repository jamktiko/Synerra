import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '../services/user.service';
import { FriendService } from '../services/friend.service';
import { NotificationService } from '../services/notification.service';
import { UserStore } from '../stores/user.store';
import { NormalizedRequest, UnreadMessage } from '../interfaces/chatMessage';
import { FriendRequest } from '../interfaces/friendrequest.model';
import { WebsocketFriendRequest } from '../interfaces/friend.model';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  // stores real-time websocket notifications
  private notifications: {
    senderUsername: string;
    content: string;
    timestamp: number;
    roomId: string;
    senderId: string;
    profilePicture?: string;
    type?: string;
  }[] = [];

  // unread messages from database
  private unreads: UnreadMessage[] = [];

  //pending requests from database
  private pendingRequests: FriendRequest[] = [];

  //friend request updates coming from WebSocket
  private friendRequestNotifications: WebsocketFriendRequest[] = [];

  // amount of notifications
  private totalNotifications$ = new BehaviorSubject<number>(0);

  //messages only
  private messages$ = new BehaviorSubject<typeof this.notifications>([]);

  //requests only
  private requests$ = new BehaviorSubject<
    (FriendRequest | WebsocketFriendRequest)[]
  >([]);

  //unread messages normalized with websocket messages
  private normalizedUnreads: {
    senderUsername: string;
    content: string;
    timestamp: number;
    roomId: string;
    senderId: string;
    profilePicture?: string;
    type?: string;
  }[] = [];

  constructor(
    private userService: UserService,
    private friendService: FriendService,
    private notificationService: NotificationService,
    private userStore: UserStore
  ) {
    // Fetch pending requests from DB
    this.friendService.getPendingRequests().subscribe({
      next: () => {},
      error: (err) => console.error('Failed to fetch pending requests', err),
    });

    // Fetch unread messages from DB
    this.userService.fetchUnreadMessages().subscribe({
      next: () => {},
      error: (err) => console.error('Failed to fetch unread messages', err),
    });

    // Listen to DB unreads
    this.userService.unreads$.subscribe((messages) => {
      this.unreads = messages.filter(
        (msg) => msg.Relation !== 'FRIEND_REQUEST' // filter out friend requests
      );

      // convert to UI-friendly format
      this.normalizedUnreads = this.unreads.map((u) => ({
        senderUsername: u.SenderUsername,
        content: u.Content,
        timestamp: u.Timestamp,
        roomId: u.RoomId,
        senderId: u.SenderId,
        profilePicture: u.ProfilePicture ?? '',
        type: 'MESSAGE',
      }));
      this.updateAll();
    });

    // Listen to DB pending friend requests
    this.friendService.pendingRequests$.subscribe((requests) => {
      this.pendingRequests = requests;
      this.updateAll();
    });

    // Listen to websocket notifications
    this.notificationService.notifications$.subscribe((data: any) => {
      console.log('Received WS notification in store:', data);

      switch (data.type) {
        //clear message notifications
        case 'CLEAR_ALL_MESSAGES':
          this.notifications = this.notifications.filter(
            (n) => n.type !== 'newMessage'
          );
          break;
        case 'CLEAR_ALL_REQUESTS': //clear requests
          this.friendRequestNotifications = [];
          break;
        // handles friend request notifications
        case 'friend_request':
        case 'friend_request_accepted':
        case 'friend_request_declined':
          this.friendRequestNotifications.push(this.normalizeWsRequest(data));
          break;
        default:
          // handle new message notifications
          if (data.type === 'newMessage' || data.Relation === 'MESSAGE') {
            this.notifications.push({
              senderUsername: data.senderUsername ?? 'Unknown',
              content: data.content ?? '',
              timestamp: data.timestamp ?? Date.now(),
              roomId: data.roomId ?? '',
              senderId: data.senderId ?? '',
              profilePicture: data.profilePicture ?? '',
              type: data.type,
            });
          } else {
            this.notifications.push(data); // Push raw notification as fallback
          }
      }

      this.updateAll();
    });
  }

  // normalize websocket friend requests into a consistent format
  private normalizeWsRequest(data: any): NormalizedRequest {
    const fromUsernameMatch = data.message?.match(/^(\S+)/);
    const fromUsername = fromUsernameMatch ? fromUsernameMatch[1] : 'Unknown';

    return {
      fromUserId: data.fromUserId,
      fromUsername,
      senderPicture:
        data.fromPicture ?? '/assets/svg/user-avatar-placeholder.svg',
      type: data.type,
      timestamp: data.timestamp,
      toUserId: this.userStore.getUser()?.UserId ?? '',
      status:
        data.type === 'friend_request'
          ? 'PENDING'
          : data.type === 'friend_request_accepted'
          ? 'ACCEPTED'
          : 'DECLINED',
      message: data.message,
    };
  }

  // recalculate totals and push updates to subscribers
  private updateAll() {
    this.totalNotifications$.next(
      this.deduplicatedNotifications.length + this.deduplicatedRequests.length
    );
    this.messages$.next(this.deduplicatedNotifications);
    this.requests$.next(this.deduplicatedRequests);
  }

  // public observable for total notification count
  get totalNotifications() {
    return this.totalNotifications$.asObservable();
  }

  // public observable for message notifications
  get messageNotifications() {
    return this.messages$.asObservable();
  }

  //public observable for friend requests
  get friendRequests() {
    return this.requests$.asObservable();
  }

  // remove duplicate message notifications based on sender + room + timestamp
  get deduplicatedNotifications() {
    const map = new Map<string, any>();
    const allNotifications = [...this.notifications, ...this.normalizedUnreads];

    allNotifications.forEach((n) => {
      const key = `${n.roomId}-${n.senderId}-${n.timestamp}`;
      if (!map.has(key)) map.set(key, n);
    });

    return Array.from(map.values());
  }

  // remove duplicate friend requests based on sender and target user
  get deduplicatedRequests(): (FriendRequest | WebsocketFriendRequest)[] {
    const map = new Map<string, FriendRequest | WebsocketFriendRequest>();
    const allRequests: (FriendRequest | WebsocketFriendRequest)[] = [
      ...this.pendingRequests,
      ...this.friendRequestNotifications,
    ];

    allRequests.forEach((r) => {
      const key =
        'fromUserId' in r
          ? `${r.fromUserId}-${r.toUserId}`
          : `${r.SenderId}-${this.userStore.getUser()?.UserId}`;
      if (!map.has(key)) map.set(key, r);
    });

    return Array.from(map.values());
  }

  // clear message notifications and DB unreads
  clearAllMessages() {
    this.notifications = [];
    this.unreads = [];
    this.normalizedUnreads = [];
    this.updateAll();
    this.userService.clearAllUnreads?.();
  }

  // clear friend requests
  clearFriendRequests() {
    this.pendingRequests = [];
    this.friendRequestNotifications = [];
    this.updateAll();
  }

  // remove a specific friend request
  removeFriendRequest(userId: string) {
    // Remove from underlying array
    this.friendRequestNotifications = this.friendRequestNotifications.filter(
      (r) => r.fromUserId !== userId
    );
    this.pendingRequests = this.pendingRequests.filter(
      (r) => ('fromUserId' in r ? r.fromUserId : r.SenderId) !== userId
    );
    this.updateAll(); // emit new value to requests$
  }

  // remove all message notifications related to a specific chat room
  removeNotificationsByRoom(roomId: string) {
    this.notifications = this.notifications.filter((n) => n.roomId !== roomId);
    this.normalizedUnreads = this.normalizedUnreads.filter(
      (n) => n.roomId !== roomId
    );
    this.updateAll();
  }
}
