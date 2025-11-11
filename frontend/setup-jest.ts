import 'jest-preset-angular/setup-jest';
import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Guard against multiple initializations (Jest worker / watch mode)
try {
  // initTestEnvironment throws if called more than once. Wrap in try/catch
  // so running tests in different contexts doesn't fail the whole run.
  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
} catch (e) {
  // Already initialized — ignore the error.
  // This can happen when tests are run in a way that loads this file multiple
  // times (for example, multiple jest workers). Silently ignore to allow
  // the test run to continue.
}
