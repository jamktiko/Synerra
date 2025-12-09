# Synerra - Accessibility (WCAG 2.1 AA)

This document outlines Synerra's accessibility measures and how the application complies with the WCAG 2.1 AA standard. It is intended for both developers and project maintainers.

## What is WCAG?

WCAG (Web Content Accessibility Guidelines) is a standard that ensures websites are usable for everyone, including people with various disabilities. WCAG 2.1 AA is a high-level standard covering three main areas:

1. **Perceivable** - Content is visible and readable
2. **Operable** - Pages work with keyboards and other assistive technologies
3. **Understandable** - Content is easy to understand

## Current Implementation in Synerra

### ✅ Implemented

- **Keyboard Navigation** - All buttons and forms work with the TAB key
- **Focus Indicators** - Every clickable element has a visible focus indicator (red highlight)
- **Focus Color** - `--color-primary` color is used consistently
- **Focus-visible** - Focus appears only when navigating with keyboard, not when clicking with mouse
- **Semantic HTML** - Proper HTML elements are used (button, form, nav, etc.)
- **ARIA Labels** - Buttons and form fields have clear descriptive labels
- **Text Contrast** - Text has sufficient contrast against the background
- **Responsive Design** - Application works on different screen sizes

### 🔄 Partially Implemented

- **Zoom and Text Size** - 200% zoom works, but some pages may require horizontal scrolling
- **Form Errors** - Error messages are displayed, but linking them to fields could be clearer

### ❌ Remaining Areas

- **Screen Reader Testing** - Not systematically tested yet
- **Touch Target Size** - Buttons should be at least 44x44 pixels on mobile

## Key Accessibility Features

### 1. Keyboard Usage

You can use the application with just your keyboard:
- **TAB** - move to next element
- **SHIFT+TAB** - move to previous element
- **ENTER** - activate button or link
- **SPACE** - activate button
- **ESC** - close modals and menus

### 2. Focus and Color

- When navigating with TAB, the active element has a **red ring** around it (primary color)
- When clicking with mouse, the focus ring **is not visible** (UI stays clean)
- Focus ring is always **clearly visible** - at least 2px thick

### 3. Contrast

- **Dark Background**: White text (high contrast)
- **Focus Ring**: Red background with sufficient contrast

### 4. Navigation

- Navigation is logical: top to bottom, left to right
- Same focus ring for all elements

## Testing

### Automated Tests

The `frontend/cypress/` folder contains Cypress tests that validate:
- Keyboard navigation
- Focus visibility

Run tests with:
```bash
npm run test:e2e
```

### Manual Testing

You can best test Synerra's accessibility on your own machine:

1. **Keyboard Sweep**
   - Open Synerra app
   - Press TAB several times
   - Verify focus moves logically
   - Verify every button can be activated

2. **Zoom Testing**
   - Open Synerra app
   - Press Ctrl++ (or Cmd++) until zoom is 200%
   - Verify text is still readable
   - Check horizontal scrolling is only needed for large tables

3. **Screen Reader**
   - Windows: NVDA (free)
   - Mac: VoiceOver (built-in)
   - Test main flows (login, search, chat)

## Implemented Accessibility Patterns

### Focus-visible Pattern

All components use this pattern:

```css
/* No focus ring when clicking with mouse */
button:focus {
  outline: none;
}

/* Red focus ring when navigating with TAB */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Dropdown Menu Management

Social-bar and other components use `@HostListener('document:click')`:

```typescript
@HostListener('document:click', ['$event'])
onDocumentClick(event: Event): void {
  if (!this.elementRef.nativeElement.contains(event.target)) {
    this.openDropdownUserId = null;
  }
}
```

This ensures open menus close when the user clicks outside.

### Semantic HTML

- Use `<button>` elements for buttons, not `<div>`
- Use `<nav>` for navigation
- Use `<form>` for forms
- Use `<label>` for form fields

## Links and Resources

- [WCAG 2.1 Standard](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN - ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [MDN - focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [WebAIM - Keyboard](https://webaim.org/articles/keyboard/)
- [Axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for testing

## Summary

Synerra aims to be accessible for everyone. Accessibility is an ongoing process:
- Regular testing keeps us aligned with standards
- New features include accessibility from the start
- User feedback is listened to and incorporated

Questions or suggestions? Contact the Synerra team.
