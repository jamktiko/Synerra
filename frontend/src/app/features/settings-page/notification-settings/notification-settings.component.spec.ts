import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationSettingsComponent } from './notification-settings.component';
import { expect } from '@jest/globals';
import { provideRouter } from '@angular/router';

describe('NotificationSettingsComponent', () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationSettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets feedback when saving changes', () => {
    jest.useFakeTimers();
    component.saveFeedback = '';

    component.saveChanges();

    expect(component.saveFeedback).toBe('Preferences saved just now.');

    jest.runOnlyPendingTimers();
    expect(component.saveFeedback).toBe('');
    jest.useRealTimers();
  });
});
