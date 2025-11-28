import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let router: Router;

  beforeEach(async () => {
    // Configure test for reusable button component
    await TestBed.configureTestingModule({
      imports: [ButtonComponent], // Standalone component
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    // Inject Router service to test navigation functionality
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    // Verify Router service is available for navigation
    it('should have Router injected', () => {
      expect(router).toBeDefined();
    });

    // Test all @Input() properties have correct default values
    it('should initialize with default values', () => {
      expect(component.label).toBe('');
      expect(component.variant).toBe('default');
      expect(component.size).toBe('medium');
      expect(component.iconPosition).toBe('left');
      expect(component.align).toBe('center');
      expect(component.fullWidth).toBe(false);
    });

    it('should have icon as undefined by default', () => {
      expect(component.icon).toBeUndefined();
    });

    it('should have state as undefined by default', () => {
      expect(component.state).toBeUndefined();
    });

    it('should have routerLink as undefined by default', () => {
      expect(component.routerLink).toBeUndefined();
    });
  });

  // Test private helper method that converts various input types to boolean
  // This is needed because HTML attributes can be strings, booleans, or empty
  describe('coerceBoolean() - Private Method', () => {
    // Empty string is truthy in HTML attributes (e.g., <button disabled="">)
    it('should return true for empty string', () => {
      const result = (component as any).coerceBoolean('');
      expect(result).toBe(true);
    });

    it('should return true for boolean true', () => {
      const result = (component as any).coerceBoolean(true);
      expect(result).toBe(true);
    });

    // String "true" should be coerced to boolean true
    it('should return true for string "true"', () => {
      const result = (component as any).coerceBoolean('true');
      expect(result).toBe(true);
    });

    // "on" is another HTML convention for true
    it('should return true for string "on"', () => {
      const result = (component as any).coerceBoolean('on');
      expect(result).toBe(true);
    });

    it('should return false for boolean false', () => {
      const result = (component as any).coerceBoolean(false);
      expect(result).toBe(false);
    });

    it('should return false for string "false"', () => {
      const result = (component as any).coerceBoolean('false');
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = (component as any).coerceBoolean(undefined);
      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = (component as any).coerceBoolean(null);
      expect(result).toBe(false);
    });

    it('should return false for number 0', () => {
      const result = (component as any).coerceBoolean(0);
      expect(result).toBe(false);
    });

    it('should return false for number 1', () => {
      const result = (component as any).coerceBoolean(1);
      expect(result).toBe(false);
    });
  });

  // Test the @Input() property setter that handles various truthy/falsy values
  // This ensures fullWidth works correctly whether set via JS or HTML attributes
  describe('fullWidth Setter and Getter', () => {
    it('should set fullWidth to true when value is true', () => {
      component.fullWidth = true;
      expect(component.fullWidth).toBe(true);
    });

    // HTML: <button fullWidth=""> should enable fullWidth
    it('should set fullWidth to true when value is empty string', () => {
      component.fullWidth = '';
      expect(component.fullWidth).toBe(true);
    });

    it('should set fullWidth to true when value is "true"', () => {
      component.fullWidth = 'true';
      expect(component.fullWidth).toBe(true);
    });

    it('should set fullWidth to true when value is "on"', () => {
      component.fullWidth = 'on';
      expect(component.fullWidth).toBe(true);
    });

    it('should set fullWidth to false when value is false', () => {
      component.fullWidth = false;
      expect(component.fullWidth).toBe(false);
    });

    it('should set fullWidth to false when value is "false"', () => {
      component.fullWidth = 'false';
      expect(component.fullWidth).toBe(false);
    });

    it('should set fullWidth to false when value is undefined', () => {
      component.fullWidth = undefined;
      expect(component.fullWidth).toBe(false);
    });

    it('should set fullWidth to false when value is null', () => {
      component.fullWidth = null;
      expect(component.fullWidth).toBe(false);
    });
  });

  // Test kebab-case alias for fullWidth
  // Allows both [fullWidth] and [full-width] in templates
  describe('fullWidthKebab Setter', () => {
    it('should set fullWidth to true via kebab-case syntax', () => {
      (component as any).fullWidthKebab = true;
      expect(component.fullWidth).toBe(true);
    });

    it('should set fullWidth to false via kebab-case syntax', () => {
      (component as any).fullWidthKebab = false;
      expect(component.fullWidth).toBe(false);
    });

    it('should set fullWidth to true via kebab-case with empty string', () => {
      (component as any).fullWidthKebab = '';
      expect(component.fullWidth).toBe(true);
    });
  });

  // Test navigation functionality - button can act as a router link
  describe('navigate() Method', () => {
    // Create a spy to track router.navigate calls without actual navigation
    it('should call router.navigate when routerLink is set and not disabled', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/dashboard';

      component.navigate();

      // Verify navigate was called with correct path as array
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should call router.navigate when state is undefined', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/profile';
      component.state = undefined;

      component.navigate();

      expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
    });

    it('should call router.navigate when state is "active"', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/social';
      component.state = 'active';

      component.navigate();

      expect(navigateSpy).toHaveBeenCalledWith(['/social']);
    });

    it('should not navigate when routerLink is undefined', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = undefined;

      component.navigate();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not navigate when state is "disabled"', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/dashboard';
      component.state = 'disabled';

      component.navigate();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not navigate when routerLink is empty string', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '';

      component.navigate();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not navigate when routerLink is null', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = null as any;

      component.navigate();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple navigate calls', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/page1';

      component.navigate();
      component.routerLink = '/page2';
      component.navigate();
      component.routerLink = '/page3';
      component.navigate();

      expect(navigateSpy).toHaveBeenCalledTimes(3);
      expect(navigateSpy).toHaveBeenNthCalledWith(1, ['/page1']);
      expect(navigateSpy).toHaveBeenNthCalledWith(2, ['/page2']);
      expect(navigateSpy).toHaveBeenNthCalledWith(3, ['/page3']);
    });
  });

  describe('Input Properties', () => {
    it('should set label correctly', () => {
      component.label = 'Test Button';
      expect(component.label).toBe('Test Button');
    });

    it('should set icon correctly', () => {
      component.icon = 'Google';
      expect(component.icon).toBe('Google');
    });

    it('should set variant to "default"', () => {
      component.variant = 'default';
      expect(component.variant).toBe('default');
    });

    it('should set variant to "highlight"', () => {
      component.variant = 'highlight';
      expect(component.variant).toBe('highlight');
    });

    it('should set variant to "sidebar"', () => {
      component.variant = 'sidebar';
      expect(component.variant).toBe('sidebar');
    });

    it('should set size to "small"', () => {
      component.size = 'small';
      expect(component.size).toBe('small');
    });

    it('should set size to "medium"', () => {
      component.size = 'medium';
      expect(component.size).toBe('medium');
    });

    it('should set size to "large"', () => {
      component.size = 'large';
      expect(component.size).toBe('large');
    });

    it('should set iconPosition to "left"', () => {
      component.iconPosition = 'left';
      expect(component.iconPosition).toBe('left');
    });

    it('should set iconPosition to "right"', () => {
      component.iconPosition = 'right';
      expect(component.iconPosition).toBe('right');
    });

    it('should set state to "active"', () => {
      component.state = 'active';
      expect(component.state).toBe('active');
    });

    it('should set state to "disabled"', () => {
      component.state = 'disabled';
      expect(component.state).toBe('disabled');
    });

    it('should set align to "left"', () => {
      component.align = 'left';
      expect(component.align).toBe('left');
    });

    it('should set align to "center"', () => {
      component.align = 'center';
      expect(component.align).toBe('center');
    });

    it('should set routerLink correctly', () => {
      component.routerLink = '/dashboard';
      expect(component.routerLink).toBe('/dashboard');
    });
  });

  describe('UI Rendering', () => {
    it('should render button element', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should apply btn base class', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn')).toBe(true);
    });

    it('should render button label', () => {
      component.label = 'Click Me';
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.btn-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toBe('Click Me');
    });

    it('should apply default variant class', () => {
      component.variant = 'default';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-default')).toBe(true);
    });

    it('should apply highlight variant class', () => {
      component.variant = 'highlight';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-highlight')).toBe(true);
    });

    it('should apply sidebar variant class', () => {
      component.variant = 'sidebar';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-sidebar')).toBe(true);
    });

    it('should apply sidebar-active class when sidebar variant and active state', () => {
      component.variant = 'sidebar';
      component.state = 'active';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-sidebar-active')).toBe(true);
    });

    it('should apply small size class', () => {
      component.size = 'small';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-small')).toBe(true);
    });

    it('should apply medium size class', () => {
      component.size = 'medium';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-medium')).toBe(true);
    });

    it('should apply large size class', () => {
      component.size = 'large';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-large')).toBe(true);
    });

    it('should apply full width class when fullWidth is true', () => {
      component.fullWidth = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-full')).toBe(true);
    });

    it('should apply active class when state is active', () => {
      component.state = 'active';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-active')).toBe(true);
    });

    it('should apply disabled attribute when state is disabled', () => {
      component.state = 'disabled';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not apply disabled attribute when state is not disabled', () => {
      component.state = 'active';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBeNull();
    });

    it('should render icon on left by default', () => {
      component.icon = 'Google';
      component.iconPosition = 'left';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('src')).toContain('assets/svg/Google.svg');
      expect(icon.getAttribute('alt')).toBe('Google icon');
    });

    it('should render icon on right when iconPosition is right', () => {
      component.icon = 'ArrowKey/RightArrow';
      component.iconPosition = 'right';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-icon-right')).toBe(true);

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon).toBeTruthy();
      expect(icon.getAttribute('src')).toContain(
        'assets/svg/ArrowKey/RightArrow.svg'
      );
    });

    it('should not render icon when icon is not set', () => {
      component.icon = undefined;
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon).toBeNull();
    });

    it('should apply btn-left class when iconPosition is left', () => {
      component.iconPosition = 'left';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-left')).toBe(true);
    });
  });

  describe('Button Click Behavior', () => {
    it('should call navigate when button is clicked', () => {
      const navigateSpy = jest.spyOn(component, 'navigate');
      component.routerLink = '/dashboard';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should not navigate when button is disabled and clicked', () => {
      const routerNavigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/dashboard';
      component.state = 'disabled';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(routerNavigateSpy).not.toHaveBeenCalled();
    });

    it('should navigate when button is active and clicked', () => {
      const routerNavigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/profile';
      component.state = 'active';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(routerNavigateSpy).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('Variant Combinations', () => {
    it('should work with highlight variant + large size', () => {
      component.variant = 'highlight';
      component.size = 'large';
      component.label = 'Large Button';
      fixture.detectChanges();

      expect(component.variant).toBe('highlight');
      expect(component.size).toBe('large');
      expect(component.label).toBe('Large Button');

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-highlight')).toBe(true);
      expect(button.classList.contains('btn-large')).toBe(true);
    });

    it('should work with sidebar variant + active state', () => {
      component.variant = 'sidebar';
      component.state = 'active';
      fixture.detectChanges();

      expect(component.variant).toBe('sidebar');
      expect(component.state).toBe('active');

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-sidebar')).toBe(true);
      expect(button.classList.contains('btn-sidebar-active')).toBe(true);
      expect(button.classList.contains('btn-active')).toBe(true);
    });

    it('should work with icon + right position', () => {
      component.icon = 'ArrowKey/RightArrow';
      component.iconPosition = 'right';
      component.label = 'Next';
      fixture.detectChanges();

      expect(component.icon).toBe('ArrowKey/RightArrow');
      expect(component.iconPosition).toBe('right');
      expect(component.label).toBe('Next');

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-icon-right')).toBe(true);
    });

    it('should work with fullWidth + highlight', () => {
      component.fullWidth = true;
      component.variant = 'highlight';
      component.label = 'Full Width Button';
      fixture.detectChanges();

      expect(component.fullWidth).toBe(true);
      expect(component.variant).toBe('highlight');
      expect(component.label).toBe('Full Width Button');

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-full')).toBe(true);
      expect(button.classList.contains('btn-highlight')).toBe(true);
    });

    it('should work with all size variants', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = [
        'small',
        'medium',
        'large',
      ];

      sizes.forEach((size) => {
        component.size = size;
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('button');
        expect(button.classList.contains(`btn-${size}`)).toBe(true);
      });
    });

    it('should work with all variant types', () => {
      const variants: Array<'default' | 'highlight' | 'sidebar'> = [
        'default',
        'highlight',
        'sidebar',
      ];

      variants.forEach((variant) => {
        component.variant = variant;
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('button');
        expect(button.classList.contains(`btn-${variant}`)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty label', () => {
      component.label = '';
      fixture.detectChanges();

      expect(component.label).toBe('');
      const label = fixture.nativeElement.querySelector('.btn-label');
      expect(label.textContent).toBe('');
    });

    it('should handle long label text', () => {
      const longLabel =
        'This is an extremely long button text that might break the layout in some cases';
      component.label = longLabel;
      fixture.detectChanges();

      expect(component.label).toBe(longLabel);
      const label = fixture.nativeElement.querySelector('.btn-label');
      expect(label.textContent).toBe(longLabel);
    });

    it('should handle special characters in label', () => {
      component.label = 'Button <>&"\'';
      fixture.detectChanges();

      expect(component.label).toBe('Button <>&"\'');
    });

    it('should handle unicode characters in label', () => {
      component.label = '🎮 Play Now! 🚀';
      fixture.detectChanges();

      expect(component.label).toBe('🎮 Play Now! 🚀');
      const label = fixture.nativeElement.querySelector('.btn-label');
      expect(label.textContent).toContain('🎮');
      expect(label.textContent).toContain('🚀');
    });

    it('should handle routerLink with query parameters', () => {
      const routerNavigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/profile?tab=games&id=123';

      component.navigate();

      expect(routerNavigateSpy).toHaveBeenCalledWith([
        '/profile?tab=games&id=123',
      ]);
    });

    it('should handle routerLink with hash', () => {
      const routerNavigateSpy = jest.spyOn(router, 'navigate');
      component.routerLink = '/dashboard#top';

      component.navigate();

      expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard#top']);
    });

    it('should handle nested icon paths', () => {
      component.icon = 'ArrowKey/RightArrow';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon.getAttribute('src')).toBe(
        'assets/svg/ArrowKey/RightArrow.svg'
      );
    });

    it('should handle changing routerLink multiple times', () => {
      component.routerLink = '/dashboard';
      expect(component.routerLink).toBe('/dashboard');

      component.routerLink = '/profile';
      expect(component.routerLink).toBe('/profile');

      component.routerLink = '/social';
      expect(component.routerLink).toBe('/social');
    });

    it('should handle switching between disabled and enabled states', () => {
      component.state = 'disabled';
      fixture.detectChanges();

      let button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);

      component.state = undefined;
      fixture.detectChanges();

      button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
    });

    it('should handle switching icon position dynamically', () => {
      component.icon = 'Google';
      component.iconPosition = 'left';
      fixture.detectChanges();

      let button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-left')).toBe(true);
      expect(button.classList.contains('btn-icon-right')).toBe(false);

      component.iconPosition = 'right';
      fixture.detectChanges();

      button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-icon-right')).toBe(true);
    });

    it('should handle switching variants dynamically', () => {
      component.variant = 'default';
      fixture.detectChanges();

      let button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-default')).toBe(true);

      component.variant = 'highlight';
      fixture.detectChanges();

      button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-highlight')).toBe(true);

      component.variant = 'sidebar';
      fixture.detectChanges();

      button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-sidebar')).toBe(true);
    });

    it('should handle multiple property changes at once', () => {
      component.label = 'Updated';
      component.variant = 'highlight';
      component.size = 'large';
      component.fullWidth = true;
      component.state = 'active';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('btn-highlight')).toBe(true);
      expect(button.classList.contains('btn-large')).toBe(true);
      expect(button.classList.contains('btn-full')).toBe(true);
      expect(button.classList.contains('btn-active')).toBe(true);

      const label = fixture.nativeElement.querySelector('.btn-label');
      expect(label.textContent).toBe('Updated');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-disabled attribute when disabled', () => {
      component.state = 'disabled';
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });

    it('should not have aria-disabled attribute when not disabled', () => {
      component.state = undefined;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-disabled')).toBeNull();
    });

    it('should have alt text for icon images', () => {
      component.icon = 'Google';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon.getAttribute('alt')).toBe('Google icon');
    });

    it('should have correct alt text for nested icon paths', () => {
      component.icon = 'ArrowKey/RightArrow';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon.getAttribute('alt')).toBe('ArrowKey/RightArrow icon');
    });
  });
});
