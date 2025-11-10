import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsTabComponent } from './notifications-tab.component';

xdescribe('NotificationsTabComponent', () => {
  let component: NotificationsTabComponent;
  let fixture: ComponentFixture<NotificationsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
