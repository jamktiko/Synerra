import { enableProdMode, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Checks if the app is not being run in development mode (so if it's production)
// and disables all console.logs if so
if (!isDevMode()) {
  enableProdMode();

  // Disable console.log in production
  window.console.log = () => {};
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
