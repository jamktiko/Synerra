import { render, screen } from '@testing-library/angular';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('renders with default variant', async () => {
    await render(ButtonComponent, {
      componentProperties: { variant: 'default', label: 'Click me' },
    });

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('btn', 'btn-default');
  });

  it('renders with highlight variant and active state', async () => {
    await render(ButtonComponent, {
      componentProperties: {
        variant: 'highlight',
        state: 'active',
        label: 'Highlight',
      },
    });

    const button = screen.getByRole('button', { name: /highlight/i });
    expect(button).toHaveClass('btn-highlight', 'btn-active');
  });

  it('applies size classes', async () => {
    await render(ButtonComponent, {
      componentProperties: { size: 'small', label: 'Small' },
    });

    const button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('btn-small');
  });

  it('disables button when state is disabled', async () => {
    await render(ButtonComponent, {
      componentProperties: { state: 'disabled', label: 'Disabled' },
    });

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders icon on the left', async () => {
    await render(ButtonComponent, {
      componentProperties: {
        icon: 'home',
        iconPosition: 'left',
        label: 'Home',
      },
    });

    const icon = screen.getByAltText(/home icon/i);
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('btn-icon');
  });

  it('renders icon on the right', async () => {
    await render(ButtonComponent, {
      componentProperties: {
        icon: 'settings',
        iconPosition: 'right',
        label: 'Settings',
      },
    });

    const icon = screen.getByAltText(/settings icon/i);
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('btn-icon');
  });
});
