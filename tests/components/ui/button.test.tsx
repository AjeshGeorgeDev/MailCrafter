import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('destructive');
  });

  it('should apply size classes', () => {
    const { container } = render(<Button size="lg">Large Button</Button>);
    const button = container.querySelector('button');
    // Check for size-specific classes (h-11, px-8 for lg)
    expect(button?.className).toContain('h-11');
    expect(button?.className).toContain('px-8');
  });

  it('should be disabled when disabled prop is true', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('should handle onClick events', () => {
    const handleClick = vi.fn();
    const { container } = render(<Button onClick={handleClick}>Click</Button>);
    const button = container.querySelector('button');
    button?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

