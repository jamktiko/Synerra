import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseGamePageComponent } from './choose-game-page.component';

describe('ChooseGamePageComponent', () => {
  let component: ChooseGamePageComponent;
  let fixture: ComponentFixture<ChooseGamePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseGamePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseGamePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
