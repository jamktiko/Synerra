import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialMenuComponent } from './social-menu.component';
import { expect } from '@jest/globals';
import { provideRouter } from '@angular/router';

describe('SocialMenuComponent', () => {
  let component: SocialMenuComponent;
  let fixture: ComponentFixture<SocialMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
