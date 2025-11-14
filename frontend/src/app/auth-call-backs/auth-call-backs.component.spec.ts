import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCallBacksComponent } from './auth-call-backs.component';

describe('AuthCallBacksComponent', () => {
  let component: AuthCallBacksComponent;
  let fixture: ComponentFixture<AuthCallBacksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCallBacksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallBacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
