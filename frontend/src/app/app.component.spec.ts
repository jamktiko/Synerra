import { AppComponent } from './app.component';
import { expect } from '@jest/globals';

describe('AppComponent', () => {
  let component: AppComponent;

  beforeEach(() => {
    component = new AppComponent();
  });

  it('should create the app', () => {
    expect(component.title).toEqual('frontend');
  });
});
