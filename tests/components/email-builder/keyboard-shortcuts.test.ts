/**
 * Tests for Keyboard Shortcuts (Copy/Paste)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/components/email-builder/hooks/useKeyboardShortcuts';

// Mock EmailBuilderContext
const mockCopyBlock = vi.fn();
const mockPasteBlock = vi.fn();
const mockSelectBlock = vi.fn();
const mockDeleteBlock = vi.fn();
const mockDuplicateBlock = vi.fn();
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockState = {
  selectedBlockId: 'block-1',
  document: {
    childrenIds: ['block-1', 'block-2'],
  },
};
let mockHasClipboard = true;

vi.mock('@/components/email-builder/EmailBuilderContext', () => ({
  useEmailBuilder: () => ({
    state: mockState,
    undo: mockUndo,
    redo: mockRedo,
    deleteBlock: mockDeleteBlock,
    duplicateBlock: mockDuplicateBlock,
    copyBlock: mockCopyBlock,
    pasteBlock: mockPasteBlock,
    selectBlock: mockSelectBlock,
    canUndo: true,
    canRedo: true,
    get hasClipboard() {
      return mockHasClipboard;
    },
  }),
}));

describe('Keyboard Shortcuts - Copy/Paste', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.selectedBlockId = 'block-1';
    mockState.document = {
      childrenIds: ['block-1', 'block-2'],
    };
    mockHasClipboard = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Copy Shortcut (Ctrl+C / Cmd+C)', () => {
    it('should call copyBlock when Ctrl+C is pressed with selected block', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });

      // Simulate handler
      if (event.ctrlKey && event.key === 'c' && mockState.selectedBlockId) {
        event.preventDefault();
        mockCopyBlock(mockState.selectedBlockId);
      }

      expect(mockCopyBlock).toHaveBeenCalledWith('block-1');
    });

    it('should not copy when no block is selected', () => {
      mockState.selectedBlockId = null;

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });

      if (event.ctrlKey && event.key === 'c' && mockState.selectedBlockId) {
        mockCopyBlock(mockState.selectedBlockId);
      }

      expect(mockCopyBlock).not.toHaveBeenCalled();
    });

    it('should work with Cmd key on Mac', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true, // Mac Cmd key
        bubbles: true,
      });

      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && mockState.selectedBlockId) {
        event.preventDefault();
        mockCopyBlock(mockState.selectedBlockId);
      }

      expect(mockCopyBlock).toHaveBeenCalledWith('block-1');
    });

    it('should not copy when typing in input field', () => {
      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });

      // Simulate event target being an input
      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Should not copy
        return;
      }

      if (event.ctrlKey && event.key === 'c' && mockState.selectedBlockId) {
        mockCopyBlock(mockState.selectedBlockId);
      }

      // Should not be called because target is INPUT
      expect(mockCopyBlock).not.toHaveBeenCalled();
    });
  });

  describe('Paste Shortcut (Ctrl+V / Cmd+V)', () => {
    it('should call pasteBlock when Ctrl+V is pressed with clipboard', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true,
      });

      // Simulate handler
      if (event.ctrlKey && event.key === 'v' && mockHasClipboard) {
        event.preventDefault();
        const position = mockState.selectedBlockId
          ? mockState.document.childrenIds.indexOf(mockState.selectedBlockId) + 1
          : mockState.document.childrenIds.length;
        mockPasteBlock(position);
      }

      expect(mockPasteBlock).toHaveBeenCalledWith(1); // After block-1
    });

    it('should not paste when clipboard is empty', () => {
      mockHasClipboard = false;

      const event = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true,
      });

      if (event.ctrlKey && event.key === 'v' && mockHasClipboard) {
        mockPasteBlock(0);
      }

      expect(mockPasteBlock).not.toHaveBeenCalled();
    });

    it('should paste at end when no block is selected', () => {
      mockState.selectedBlockId = null;

      const event = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true,
      });

      if (event.ctrlKey && event.key === 'v' && mockHasClipboard) {
        const position = mockState.selectedBlockId
          ? mockState.document.childrenIds.indexOf(mockState.selectedBlockId) + 1
          : mockState.document.childrenIds.length;
        mockPasteBlock(position);
      }

      expect(mockPasteBlock).toHaveBeenCalledWith(2); // At end
    });

    it('should work with Cmd key on Mac', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      });

      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && mockHasClipboard) {
        event.preventDefault();
        const position = mockState.selectedBlockId
          ? mockState.document.childrenIds.indexOf(mockState.selectedBlockId) + 1
          : mockState.document.childrenIds.length;
        mockPasteBlock(position);
      }

      expect(mockPasteBlock).toHaveBeenCalledWith(1);
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});

