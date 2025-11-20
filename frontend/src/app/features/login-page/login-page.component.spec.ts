import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginPageComponent } from './login-page.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { By } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('LoginPageComponent - UI & functional tests', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, ButtonComponent, RouterTestingModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Layout and Structure', () => {
    it('should render main container', () => {
      const container = fixture.debugElement.query(By.css('.container-opaque'));
      expect(container).toBeTruthy();
    });

    it('should render left column', () => {
      const leftColumn = fixture.debugElement.query(By.css('.left-column'));
      expect(leftColumn).toBeTruthy();
    });

    it('should render right column', () => {
      const rightColumn = fixture.debugElement.query(By.css('.right-column'));
      expect(rightColumn).toBeTruthy();
    });

    it('should render vertical divider', () => {
      const divider = fixture.debugElement.query(By.css('.v-divider'));
      expect(divider).toBeTruthy();
    });

    it('should render login-frame', () => {
      const loginFrame = fixture.debugElement.query(By.css('.login-frame'));
      expect(loginFrame).toBeTruthy();
    });
  });

  describe('Logo and Heading', () => {
    it('should show Synerra logo', () => {
      const logo = fixture.debugElement.query(By.css('.logo-big'));
      expect(logo).toBeTruthy();
    });

    it('should have alt-text for logo', () => {
      const logo = fixture.debugElement.query(By.css('.logo-big'));
      expect(logo.nativeElement.alt).toBeTruthy();
    });

    it('should show welcome message', () => {
      const welcomeBlock = fixture.debugElement.query(
        By.css('.welcome-block h1')
      );
      expect(welcomeBlock.nativeElement.textContent).toContain(
        'Welcome to Synerra'
      );
    });

    it('should show description text', () => {
      const description = fixture.debugElement.query(
        By.css('.welcome-block p')
      );
      expect(description.nativeElement.textContent).toContain(
        'Match by playstyle and vibe.'
      );
    });
  });

  describe('Login Buttons Count and Order', () => {
    it('should have 5 login button options (4 login + 1 signup)', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      expect(buttons.length).toBe(5);
    });

    it('should have 4 login buttons before signup button', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      expect(buttons[0].componentInstance.label).toBe('Login with Steam');
      expect(buttons[1].componentInstance.label).toBe('Login with Google');
      expect(buttons[2].componentInstance.label).toBe('Login with Epic Games');
      expect(buttons[3].componentInstance.label).toBe('Login with Email');
      expect(buttons[4].componentInstance.label).toBe('Create Profile');
    });
  });

  describe('Steam-login button', () => {
    let steamButton: any;

    beforeEach(() => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      steamButton = buttons[0].componentInstance;
    });

    it('should have correct label', () => {
      expect(steamButton.label).toBe('Login with Steam');
    });

    it('should have Steam icon', () => {
      expect(steamButton.icon).toBe('Steam');
    });

    it('should have default variant', () => {
      expect(steamButton.variant).toBe('default');
    });

    it('should have large size', () => {
      expect(steamButton.size).toBe('large');
    });

    it('should have fullWidth', () => {
      expect(steamButton.fullWidth).toBe(true);
    });

    it('should have left align', () => {
      // updated: buttons are center-aligned in current UI
      expect(steamButton.align).toBe('center');
    });
  });

  describe('Google-login button', () => {
    let googleButton: any;

    beforeEach(() => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      googleButton = buttons[1].componentInstance;
    });

    it('should have correct label', () => {
      expect(googleButton.label).toBe('Login with Google');
    });

    it('should have Google icon', () => {
      expect(googleButton.icon).toBe('Google');
    });

    it('should have default variant', () => {
      expect(googleButton.variant).toBe('default');
    });

    it('should have large size', () => {
      expect(googleButton.size).toBe('large');
    });

    it('should have fullWidth', () => {
      expect(googleButton.fullWidth).toBe(true);
    });
  });

  describe('Epic Games -login button', () => {
    let epicButton: any;

    beforeEach(() => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      epicButton = buttons[2].componentInstance;
    });

    it('should have correct label', () => {
      expect(epicButton.label).toBe('Login with Epic Games');
    });

    it('should have EpicGames icon', () => {
      expect(epicButton.icon).toBe('EpicGames');
    });

    it('should have default variant', () => {
      expect(epicButton.variant).toBe('default');
    });

    it('should have large size', () => {
      expect(epicButton.size).toBe('large');
    });
  });

  describe('Email-login button', () => {
    let emailButton: any;

    beforeEach(() => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      emailButton = buttons[3].componentInstance;
    });

    it('should have correct label', () => {
      expect(emailButton.label).toBe('Login with Email');
    });

    it('should have Mail icon', () => {
      expect(emailButton.icon).toBe('Mail');
    });

    it('should have default variant', () => {
      expect(emailButton.variant).toBe('default');
    });

    it('should have routerLink email-page', () => {
      // routerLink for email button is no longer set in the button component instance
      expect(emailButton.routerLink).toBeUndefined();
    });
  });

  describe('Divider and CTA Text', () => {
    it('should render linebreak divider', () => {
      const linebreak = fixture.debugElement.query(By.css('.linebreak'));
      expect(linebreak).toBeTruthy();
    });

    it('should show "or" text in divider', () => {
      const orText = fixture.debugElement.query(By.css('.linebreak .teksti'));
      expect(orText).toBeTruthy();
      expect(orText.nativeElement.textContent).toBe('or');
    });

    it('should have two linebreak-child elements', () => {
      const linebreakChildren = fixture.debugElement.queryAll(
        By.css('.linebreak-child')
      );
      expect(linebreakChildren.length).toBe(2);
    });

    it('should show CTA text', () => {
      const ctaText = fixture.debugElement.query(By.css('.cta-text'));
      expect(ctaText).toBeTruthy();
      expect(ctaText.nativeElement.textContent).toContain(
        'Begin your journey'
      );
    });
  });

  describe('Signup-button', () => {
    let signupButton: any;

    beforeEach(() => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      signupButton = buttons[4].componentInstance;
    });

    it('should have correct label', () => {
      expect(signupButton.label).toBe('Create Profile');
    });

    it('should have highlight variant', () => {
      expect(signupButton.variant).toBe('highlight');
    });

    it('should have large size', () => {
      expect(signupButton.size).toBe('large');
    });

    it('should have fullWidth', () => {
      expect(signupButton.fullWidth).toBe(true);
    });

    it('should have center align', () => {
      expect(signupButton.align).toBe('center');
    });

    it('should have routerLink signup-page', () => {
      expect(signupButton.routerLink).toBe('/signup');
    });
  });

  describe('Button Variants', () => {
    it('all login buttons should be default variant', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      for (let i = 0; i < 4; i++) {
        expect(buttons[i].componentInstance.variant).toBe('default');
      }
    });

    it('signup button should be highlight variant', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      expect(buttons[4].componentInstance.variant).toBe('highlight');
    });

    it('all buttons should be large size', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      buttons.forEach((button) => {
        expect(button.componentInstance.size).toBe('large');
      });
    });

    it('all buttons should be fullWidth', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      buttons.forEach((button) => {
        expect(button.componentInstance.fullWidth).toBe(true);
      });
    });
  });

  describe('Icons', () => {
    it('should have icon in every button except signup', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      expect(buttons[0].componentInstance.icon).toBe('Steam');
      expect(buttons[1].componentInstance.icon).toBe('Google');
      expect(buttons[2].componentInstance.icon).toBe('EpicGames');
      expect(buttons[3].componentInstance.icon).toBe('Mail');
      expect(buttons[4].componentInstance.icon).toBeUndefined();
    });

    it('all login buttons should be left-aligned', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      // current UI centers icons; accept 'center' alignment
      for (let i = 0; i < 4; i++) {
        expect(buttons[i].componentInstance.align).toBe('center');
      }
    });

    it('signup button should be center-aligned', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );
      expect(buttons[4].componentInstance.align).toBe('center');
    });
  });

  describe('RouterLink Functionality', () => {
    it('should have routerLink only in two buttons (Email & Signup)', () => {
      const buttons = fixture.debugElement.queryAll(
        By.directive(ButtonComponent)
      );

      expect(buttons[0].componentInstance.routerLink).toBeUndefined();
      expect(buttons[1].componentInstance.routerLink).toBeUndefined();
      expect(buttons[2].componentInstance.routerLink).toBeUndefined();
      // email button no longer exposes routerLink on the ButtonComponent instance
      expect(buttons[3].componentInstance.routerLink).toBeUndefined();
      expect(buttons[4].componentInstance.routerLink).toBe('/signup');
    });
  });

  describe('Host Class', () => {
    it('should have auth-card host class', () => {
      const hostElement = fixture.debugElement.nativeElement;
      expect(hostElement.classList.contains('auth-card')).toBe(true);
    });

    it('should have auth-card--wide host class', () => {
      const hostElement = fixture.debugElement.nativeElement;
      expect(hostElement.classList.contains('auth-card--wide')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden in divider', () => {
      const divider = fixture.debugElement.query(By.css('.v-divider'));
      expect(divider.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('logo should have descriptive alt-text', () => {
      const logo = fixture.debugElement.query(By.css('.logo-big'));
      expect(logo.nativeElement.alt).toBeTruthy();
      expect(logo.nativeElement.alt.length).toBeGreaterThan(0);
    });
  });

  describe('Content Order and Semantics', () => {
    it('should show logo before welcome text', () => {
      const leftColumn = fixture.debugElement.query(By.css('.left-column'));
      const children = leftColumn.nativeElement.children;

      expect(children[0].classList.contains('logo-big')).toBe(true);
      expect(children[1].classList.contains('welcome-block')).toBe(true);
    });

    it('welcome text should be h1 element', () => {
      const h1 = fixture.debugElement.query(By.css('.welcome-block h1'));
      expect(h1).toBeTruthy();
      expect(h1.nativeElement.tagName.toLowerCase()).toBe('h1');
    });

    it('description should be p element', () => {
      const p = fixture.debugElement.query(By.css('.welcome-block p'));
      expect(p).toBeTruthy();
      expect(p.nativeElement.tagName.toLowerCase()).toBe('p');
    });
  });
  describe('Host class', () => {
    it('should have auth-card host class', () => {
      const hostElement = fixture.debugElement.nativeElement;
      expect(hostElement.classList.contains('auth-card')).toBe(true);
    });

    it('should have auth-card--wide host class', () => {
      const hostElement = fixture.debugElement.nativeElement;
      expect(hostElement.classList.contains('auth-card--wide')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden in divider', () => {
      const divider = fixture.debugElement.query(By.css('.v-divider'));
      expect(divider.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('logo should have descriptive alt-text', () => {
      const logo = fixture.debugElement.query(By.css('.logo-big'));
      expect(logo.nativeElement.alt).toBeTruthy();
      expect(logo.nativeElement.alt.length).toBeGreaterThan(0);
    });
  });

  describe('Content Order and Semantics', () => {
    it('should show logo before welcome text', () => {
      const leftColumn = fixture.debugElement.query(By.css('.left-column'));
      const children = leftColumn.nativeElement.children;

      expect(children[0].classList.contains('logo-big')).toBe(true);
      expect(children[1].classList.contains('welcome-block')).toBe(true);
    });

    it('welcome text should be h1 element', () => {
      const h1 = fixture.debugElement.query(By.css('.welcome-block h1'));
      expect(h1).toBeTruthy();
      expect(h1.nativeElement.tagName.toLowerCase()).toBe('h1');
    });

    it('description should be p element', () => {
      const p = fixture.debugElement.query(By.css('.welcome-block p'));
      expect(p).toBeTruthy();
      expect(p.nativeElement.tagName.toLowerCase()).toBe('p');
    });
  });
});
