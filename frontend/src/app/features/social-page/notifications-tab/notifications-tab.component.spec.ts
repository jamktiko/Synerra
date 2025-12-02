import { NotificationsTabComponent } from './notifications-tab.component';
import { expect } from '@jest/globals';

describe('NotificationsTabComponent', () => {
  let component: NotificationsTabComponent;

  beforeEach(() => {
    // Mock of FriendService with only the methods the component calls.
    // Each mocked method returns an object with a subscribe function
    // because the real service returns observables.
    const fakeFriendService: any = {
      acceptFriendRequest: () => ({ subscribe: () => {} }),
      declineFriendRequest: () => ({ subscribe: () => {} }),
      clearAcceptedDeclinedRequests: () => ({ subscribe: () => {} }),
    };

    // Mock of ChatService, only startChat is needed.
    const fakeChatService: any = {
      startChat: () => {},
    };

    // Mock of UserService, only clearAllUnreads is needed.
    // It must also return a fake observable.
    const fakeUserService: any = {
      clearAllUnreads: () => ({ subscribe: () => {} }),
    };

    // Mock of NotificationService, only the two clearing functions are used.
    const fakeNotificationService: any = {
      clearNotifications: () => {},
      clearRequests: () => {},
    };

    // Mock of NotificationStore, only the functions used by component logic are defined.
    const fakeNotificationStore: any = {
      removeFriendRequest: () => {},
      removeNotificationsByRoom: () => {},
      clearAllMessages: () => {},
    };

    // Create component instance manually
    component = new NotificationsTabComponent(
      fakeFriendService,
      fakeChatService,
      fakeUserService,
      fakeNotificationService,
      fakeNotificationStore,
    );

    // Set input properties to valid defaults so the component doesn't operate on null values.
    component.messages = [];
    component.friendRequests = [];
    component.totalCount = 0;
  });

  it('should create', () => {
    // If constructor or required inputs break this will catch it immediately.
    expect(component).toBeTruthy();
  });
});
