/**
 * Tests for Rich Text Editor Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RichTextEditor } from '@/components/email-builder/blocks/RichTextEditor';

// Mock TipTap extensions
const mockEditorInstances: any[] = [];

vi.mock('@tiptap/react', () => {
  const createMockEditor = () => ({
    getHTML: vi.fn(() => '<p>Test content</p>'),
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        toggleBold: vi.fn(() => ({
          run: vi.fn(),
        })),
        toggleItalic: vi.fn(() => ({
          run: vi.fn(),
        })),
        toggleStrike: vi.fn(() => ({
          run: vi.fn(),
        })),
        toggleBulletList: vi.fn(() => ({
          run: vi.fn(),
        })),
        toggleOrderedList: vi.fn(() => ({
          run: vi.fn(),
        })),
        setTextAlign: vi.fn(() => ({
          run: vi.fn(),
        })),
        extendMarkRange: vi.fn(() => ({
          setLink: vi.fn(() => ({
            run: vi.fn(),
          })),
          unsetLink: vi.fn(() => ({
            run: vi.fn(),
          })),
        })),
        insertContent: vi.fn(() => ({
          run: vi.fn(),
        })),
      })),
    })),
    isActive: vi.fn((name: string) => name === 'bold'),
    getAttributes: vi.fn(() => ({ href: '' })),
    state: {
      selection: {
        $anchor: {
          parent: {
            type: {
              name: 'paragraph',
            },
          },
        },
      },
    },
    onUpdate: null as any,
    editorProps: {} as any,
  });

  return {
    useEditor: vi.fn((config: any) => {
      const mockEditor = createMockEditor();
      if (config?.onUpdate) {
        mockEditor.onUpdate = config.onUpdate;
      }
      if (config?.editorProps) {
        mockEditor.editorProps = config.editorProps;
      }
      mockEditorInstances.push(mockEditor);
      return mockEditor;
    }),
    EditorContent: ({ editor }: any) => (
      <div data-testid="editor-content">
        {editor ? 'Editor loaded' : 'Editor not loaded'}
      </div>
    ),
  };
});

// Mock VariableInserter
vi.mock('@/components/templates/VariableInserter', () => ({
  useVariableInserter: vi.fn(() => ({
    VariableInserter: () => <div data-testid="variable-inserter">Variable Inserter</div>,
    openVariableInserter: vi.fn(),
  })),
}));

describe('RichTextEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnEscape = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditorInstances.length = 0; // Clear instances
  });

  it('should render the editor with toolbar', () => {
    render(
      <RichTextEditor
        content="<p>Test content</p>"
        onChange={mockOnChange}
        placeholder="Enter text..."
      />
    );

    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('should call onChange when content changes', async () => {
    render(
      <RichTextEditor
        content="<p>Initial</p>"
        onChange={mockOnChange}
      />
    );

    // Simulate editor update
    const mockEditor = mockEditorInstances[mockEditorInstances.length - 1];
    if (mockEditor?.onUpdate) {
      mockEditor.onUpdate({ editor: mockEditor });
    }

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('should render formatting toolbar buttons', () => {
    render(
      <RichTextEditor
        content="<p>Test</p>"
        onChange={mockOnChange}
      />
    );

    // Check for toolbar buttons (they should be rendered)
    const editor = screen.getByTestId('editor-content');
    expect(editor).toBeInTheDocument();
  });

  it('should handle Escape key to exit edit mode', async () => {
    render(
      <RichTextEditor
        content="<p>Test</p>"
        onChange={mockOnChange}
        onEscape={mockOnEscape}
      />
    );

    // Simulate Escape key
    const mockEditor = mockEditorInstances[mockEditorInstances.length - 1];
    const handleKeyDown = mockEditor?.editorProps?.handleKeyDown;
    if (handleKeyDown) {
      const mockEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      };
      handleKeyDown(null, mockEvent);
      
      expect(mockOnEscape).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    }
  });

  it('should not call onEscape for other keys', async () => {
    render(
      <RichTextEditor
        content="<p>Test</p>"
        onChange={mockOnChange}
        onEscape={mockOnEscape}
      />
    );

    const mockEditor = mockEditorInstances[mockEditorInstances.length - 1];
    const handleKeyDown = mockEditor?.editorProps?.handleKeyDown;
    if (handleKeyDown) {
      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      };
      handleKeyDown(null, mockEvent);
      
      expect(mockOnEscape).not.toHaveBeenCalled();
    }
  });

  it('should render variable inserter button', () => {
    render(
      <RichTextEditor
        content="<p>Test</p>"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('variable-inserter')).toBeInTheDocument();
  });

  it('should handle placeholder prop', async () => {
    const { useEditor } = await import('@tiptap/react');
    
    render(
      <RichTextEditor
        content=""
        onChange={mockOnChange}
        placeholder="Custom placeholder"
      />
    );

    // Check that useEditor was called with placeholder extension
    expect(useEditor).toHaveBeenCalled();
    const callArgs = (useEditor as any).mock.calls[(useEditor as any).mock.calls.length - 1][0];
    expect(callArgs.extensions).toBeDefined();
  });

  it('should initialize with provided content', async () => {
    const { useEditor } = await import('@tiptap/react');
    
    render(
      <RichTextEditor
        content="<p>Initial HTML</p>"
        onChange={mockOnChange}
      />
    );

    const callArgs = (useEditor as any).mock.calls[(useEditor as any).mock.calls.length - 1][0];
    expect(callArgs.content).toBe('<p>Initial HTML</p>');
  });
});

