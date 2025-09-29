import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailLoginPageComponent } from './email-login-page.component';

describe('EmailLoginPageComponent', () => {
  let component: EmailLoginPageComponent;
  let fixture: ComponentFixture<EmailLoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailLoginPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailLoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
