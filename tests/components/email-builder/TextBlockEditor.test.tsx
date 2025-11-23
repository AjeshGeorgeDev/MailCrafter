/**
 * Tests for Text Block Editor Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextBlockEditor } from '@/components/email-builder/blocks/TextBlockEditor';
import type { TextBlock } from '@/lib/email-builder/types';

// Mock EmailBuilderContext
const mockUpdateBlock = vi.fn();
const mockState = {
  document: {} as any,
  selectedBlockId: null,
  history: [],
  historyIndex: 0,
  isDirty: false,
};

vi.mock('@/components/email-builder/EmailBuilderContext', () => ({
  useEmailBuilder: () => ({
    updateBlock: mockUpdateBlock,
    state: mockState,
  }),
}));

// Mock RichTextEditor
vi.mock('@/components/email-builder/blocks/RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange, onEscape }: any) => (
    <div data-testid="rich-text-editor">
      <textarea
        data-testid="rich-text-input"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && onEscape) {
            onEscape();
          }
        }}
      />
    </div>
  ),
}));

describe('TextBlockEditor', () => {
  const mockBlock: TextBlock = {
    type: 'Text',
    data: {
      style: {
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
        backgroundColor: null,
        color: null,
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'left',
      },
      props: {
        text: '<p>Initial text</p>',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.document = {
      'block-1': mockBlock,
    } as any;
  });

  it('should render text block in view mode', () => {
    render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    const textContent = screen.getByText(/Initial text/i);
    expect(textContent).toBeInTheDocument();
  });

  it('should enter edit mode on double-click', () => {
    render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    const textBlock = screen.getByText(/Initial text/i);
    fireEvent.doubleClick(textBlock);

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('should exit edit mode on Escape key', () => {
    render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    // Enter edit mode
    const textBlock = screen.getByText(/Initial text/i);
    fireEvent.doubleClick(textBlock);

    // Press Escape
    const editor = screen.getByTestId('rich-text-input');
    fireEvent.keyDown(editor, { key: 'Escape' });

    // Should exit edit mode
    waitFor(() => {
      expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
    });
  });

  it('should call updateBlock when content changes', () => {
    render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    // Enter edit mode
    const textBlock = screen.getByText(/Initial text/i);
    fireEvent.doubleClick(textBlock);

    // Change content
    const editor = screen.getByTestId('rich-text-input');
    fireEvent.change(editor, { target: { value: '<p>Updated text</p>' } });

    waitFor(() => {
      expect(mockUpdateBlock).toHaveBeenCalledWith('block-1', expect.objectContaining({
        data: expect.objectContaining({
          props: expect.objectContaining({
            text: '<p>Updated text</p>',
          }),
        }),
      }));
    });
  });

  it('should apply style properties to rendered block', () => {
    render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    const textBlock = screen.getByText(/Initial text/i).closest('div');
    expect(textBlock).toBeInTheDocument();
    // Check that padding is applied (the component uses a single padding string)
    expect(textBlock).toHaveStyle({
      padding: '10px 10px 10px 10px',
    });
  });

  it('should handle empty text gracefully', () => {
    const emptyBlock: TextBlock = {
      ...mockBlock,
      data: {
        ...mockBlock.data,
        props: {
          text: '',
        },
      },
    };

    mockState.document = {
      'block-1': emptyBlock,
    } as any;

    render(<TextBlockEditor block={emptyBlock} blockId="block-1" />);

    expect(screen.getByText(/Double-click to edit/i)).toBeInTheDocument();
  });

  it('should sync with document state changes', () => {
    const { rerender } = render(<TextBlockEditor block={mockBlock} blockId="block-1" />);

    // Update document state
    const updatedBlock: TextBlock = {
      ...mockBlock,
      data: {
        ...mockBlock.data,
        props: {
          text: '<p>Updated from state</p>',
        },
      },
    };

    mockState.document = {
      'block-1': updatedBlock,
    } as any;

    rerender(<TextBlockEditor block={updatedBlock} blockId="block-1" />);

    expect(screen.getByText(/Updated from state/i)).toBeInTheDocument();
  });
});

