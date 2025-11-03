import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './core/services/user.service';
import { UserStore } from './core/stores/user.store';

export function initUsers(userService: UserService, userStore: UserStore) {
  return () => {
    userService.getMe().subscribe({
      next: (res) => {
        userStore.setUser(res);
        console.log('USER: ', res);
      },
      error: (err) => console.error('Error loading users', err),
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(HttpClientModule),

    {
      provide: APP_INITIALIZER,
      useFactory: initUsers,
      deps: [UserService, UserStore],
      multi: true,
    },
  ],
};
