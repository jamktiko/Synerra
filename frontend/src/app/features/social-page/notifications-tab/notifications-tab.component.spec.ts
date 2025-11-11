import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsTabComponent } from './notifications-tab.component';

describe('NotificationsTabComponent', () => {
  let component: NotificationsTabComponent;

  // instantiate component by calling constructor with minimal stubs
  beforeEach(() => {
    const fakeFriendService: any = {
      acceptFriendRequest: () => ({ subscribe: (arg: any) => {} }),
      declineFriendRequest: () => ({ subscribe: (arg: any) => {} }),
      clearAcceptedDeclinedRequests: () => ({ subscribe: (arg: any) => {} }),
      clearAllRequests: () => {},
    };
    const fakeChatService: any = { startChat: () => {} };
    const fakeUserService: any = {
      markRoomMessagesAsRead: () => ({ subscribe: () => {} }),
      clearAllUnreads: () => {},
    };
    const fakeNotificationService: any = {
      clearNotifications: () => {},
      clearRequests: () => {},
    };

    component = new NotificationsTabComponent(
      fakeFriendService,
      fakeChatService,
      fakeUserService,
      fakeNotificationService
    );
    // initialize input arrays
    component.pendingRequests = [];
    component.notifications = [];
    component.unreads = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
