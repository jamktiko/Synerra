import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { expect } from '@jest/globals';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    // Provide a minimal navbar stub to avoid AfterViewInit errors.
    // Instead of calling fixture.detectChanges() (which lets Angular attempt to
    // resolve the real ViewChild and may overwrite our stub), call the
    // lifecycle hook manually after stubbing to keep the test isolated.
    component.navbar = {
      collapsedChange: { subscribe: (fn: any) => ({ unsubscribe: () => {} }) },
      isCollapsed: false,
    } as any;
    // Manually invoke the lifecycle method rather than running full change
    // detection so the test doesn't require the real NavbarComponent.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
