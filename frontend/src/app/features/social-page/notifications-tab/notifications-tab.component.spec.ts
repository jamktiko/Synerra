import { TestBed } from '@angular/core/testing';
import { NotificationsTabComponent } from './notifications-tab.component';

describe('NotificationsTabComponent', () => {
  let component: NotificationsTabComponent;

  beforeEach(() => {
    const fakeFriendService: any = {
      acceptFriendRequest: () => ({ subscribe: () => {} }),
      declineFriendRequest: () => ({ subscribe: () => {} }),
      clearAcceptedDeclinedRequests: () => ({ subscribe: () => {} }),
    };

    const fakeChatService: any = {
      startChat: () => {},
    };

    const fakeUserService: any = {
      clearAllUnreads: () => ({ subscribe: () => {} }),
    };

    const fakeNotificationService: any = {
      clearNotifications: () => {},
      clearRequests: () => {},
    };

    const fakeNotificationStore: any = {
      removeFriendRequest: () => {},
      removeNotificationsByRoom: () => {},
      clearAllMessages: () => {},
    };

    component = new NotificationsTabComponent(
      fakeFriendService,
      fakeChatService,
      fakeUserService,
      fakeNotificationService,
      fakeNotificationStore
    );

    // set default @Input values
    component.messages = [];
    component.friendRequests = [];
    component.totalCount = 0;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
