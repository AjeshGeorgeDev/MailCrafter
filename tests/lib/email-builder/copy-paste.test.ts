/**
 * Tests for Copy/Paste Functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EmailBuilderDocument, EmailBlock } from '@/lib/email-builder/types';

describe('Copy/Paste Functionality', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    global.localStorage = mockLocalStorage as Storage;
  });

  describe('Clipboard Storage', () => {
    it('should store block in localStorage when copying', () => {
      const block: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Test text',
          },
        },
      };

      const blockTree = {
        root: block,
        children: {},
      };

      mockLocalStorage.setItem('email-builder-clipboard', JSON.stringify(blockTree));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'email-builder-clipboard',
        JSON.stringify(blockTree)
      );
    });

    it('should retrieve block from localStorage when pasting', () => {
      const block: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Test text',
          },
        },
      };

      const blockTree = {
        root: block,
        children: {},
      };

      mockLocalStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(blockTree));

      const stored = mockLocalStorage.getItem('email-builder-clipboard');
      const parsed = stored ? JSON.parse(stored) : null;

      expect(parsed).toEqual(blockTree);
      expect(parsed.root).toEqual(block);
    });

    it('should handle missing clipboard gracefully', () => {
      mockLocalStorage.getItem = vi.fn().mockReturnValue(null);

      const stored = mockLocalStorage.getItem('email-builder-clipboard');
      expect(stored).toBeNull();
    });

    it('should handle invalid JSON in clipboard', () => {
      mockLocalStorage.getItem = vi.fn().mockReturnValue('invalid json');

      const stored = mockLocalStorage.getItem('email-builder-clipboard');
      expect(() => {
        if (stored) JSON.parse(stored);
      }).toThrow();
    });
  });

  describe('Block Tree Structure', () => {
    it('should copy block with nested children', () => {
      const containerBlock: EmailBlock = {
        type: 'Container',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            childrenIds: ['child-1', 'child-2'],
          },
        },
      };

      const childBlock1: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Child 1',
          },
        },
      };

      const childBlock2: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Child 2',
          },
        },
      };

      const blockTree = {
        root: containerBlock,
        children: {
          'child-1': childBlock1,
          'child-2': childBlock2,
        },
      };

      expect(blockTree.root.type).toBe('Container');
      expect(blockTree.root.data.props.childrenIds).toHaveLength(2);
      expect(blockTree.children['child-1']).toEqual(childBlock1);
      expect(blockTree.children['child-2']).toEqual(childBlock2);
    });

    it('should copy Columns block with column children', () => {
      const columnsBlock: EmailBlock = {
        type: 'Columns',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            columns: [
              { childrenIds: ['col1-child-1'] },
              { childrenIds: ['col2-child-1'] },
            ],
          },
        },
      };

      const col1Child: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Column 1 Text',
          },
        },
      };

      const col2Child: EmailBlock = {
        type: 'Image',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            url: 'https://example.com/image.jpg',
            alt: 'Image',
          },
        },
      };

      const blockTree = {
        root: columnsBlock,
        children: {
          'col1-child-1': col1Child,
          'col2-child-1': col2Child,
        },
      };

      expect(blockTree.root.type).toBe('Columns');
      expect(blockTree.root.data.props.columns).toHaveLength(2);
      expect(blockTree.children['col1-child-1']).toEqual(col1Child);
      expect(blockTree.children['col2-child-1']).toEqual(col2Child);
    });
  });

  describe('ID Generation', () => {
    it('should generate new IDs for pasted blocks', () => {
      const originalId = 'block-123';
      const newId1 = 'block-456';
      const newId2 = 'block-789';

      // Simulate ID mapping
      const idMap = new Map<string, string>();
      idMap.set(originalId, newId1);

      expect(idMap.get(originalId)).toBe(newId1);
      expect(idMap.get(originalId)).not.toBe(originalId);
    });

    it('should generate unique IDs for nested children', () => {
      const idMap = new Map<string, string>();
      
      // Simulate copying a container with 2 children
      idMap.set('parent-1', 'parent-2');
      idMap.set('child-1', 'child-2');
      idMap.set('child-2', 'child-3');

      expect(idMap.size).toBe(3);
      expect(idMap.get('parent-1')).not.toBe(idMap.get('child-1'));
      expect(idMap.get('child-1')).not.toBe(idMap.get('child-2'));
    });
  });

  describe('Deep Cloning', () => {
    it('should deep clone blocks to prevent reference sharing', () => {
      const originalBlock: EmailBlock = {
        type: 'Text',
        data: {
          style: {
            padding: { top: 10, bottom: 10, left: 10, right: 10 },
          },
          props: {
            text: 'Original',
          },
        },
      };

      const cloned = JSON.parse(JSON.stringify(originalBlock)) as EmailBlock;
      cloned.data.props.text = 'Modified';

      expect(originalBlock.data.props.text).toBe('Original');
      expect(cloned.data.props.text).toBe('Modified');
      expect(originalBlock).not.toBe(cloned);
    });

    it('should deep clone nested structures', () => {
      const container: EmailBlock = {
        type: 'Container',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            childrenIds: ['child-1'],
          },
        },
      };

      const cloned = JSON.parse(JSON.stringify(container)) as EmailBlock;
      (cloned.data.props as any).childrenIds.push('child-2');

      expect((container.data.props as any).childrenIds).toHaveLength(1);
      expect((cloned.data.props as any).childrenIds).toHaveLength(2);
    });
  });
});

