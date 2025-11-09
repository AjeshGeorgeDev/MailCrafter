import { describe, it, expect } from 'vitest';
import type { EmailBuilderDocument, EmailBlock, BlockType } from '@/lib/email-builder/types';

describe('Email Builder Types', () => {
  describe('EmailBuilderDocument', () => {
    it('should have required structure', () => {
      const document: EmailBuilderDocument = {
        childrenIds: [],
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      expect(document.childrenIds).toBeDefined();
      expect(document.backdropColor).toBeDefined();
      expect(document.canvasColor).toBeDefined();
    });

    it('should support nested blocks', () => {
      const document: EmailBuilderDocument = {
        childrenIds: ['block-1'],
        'block-1': {
          type: 'Container',
          data: {
            props: {
              childrenIds: ['block-2'],
            },
          },
        },
        'block-2': {
          type: 'Text',
          data: {
            props: {
              text: 'Hello',
            },
          },
        },
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      expect(document.childrenIds).toHaveLength(1);
      expect(document['block-1']).toBeDefined();
      expect(document['block-2']).toBeDefined();
    });
  });

  describe('EmailBlock', () => {
    it('should have type and data properties', () => {
      const block: EmailBlock = {
        type: 'Text',
        data: {
          props: {
            text: 'Test',
          },
        },
      };

      expect(block.type).toBe('Text');
      expect(block.data).toBeDefined();
      expect(block.data.props).toBeDefined();
    });
  });
});

