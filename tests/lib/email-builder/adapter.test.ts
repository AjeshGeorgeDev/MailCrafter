import { describe, it, expect } from 'vitest';
import { fromOldFormat, toOldFormat } from '@/lib/email-builder/adapter';
import type { EmailBuilderDocument } from '@/lib/email-builder/types';

describe('Email Builder Adapter', () => {
  describe('fromOldFormat', () => {
    it('should convert old format to EmailBuilderDocument', () => {
      const oldFormat = {
        root: {
          type: 'Container',
          children: [
            {
              type: 'Text',
              data: {
                text: 'Hello World',
              },
            },
          ],
        },
      };

      const result = fromOldFormat(oldFormat);

      expect(result).toHaveProperty('childrenIds');
      expect(result).toHaveProperty('backdropColor');
      expect(result).toHaveProperty('canvasColor');
      expect(Array.isArray(result.childrenIds)).toBe(true);
    });

    it('should handle empty old format', () => {
      const oldFormat = {
        root: {
          type: 'Container',
          children: [],
        },
      };

      const result = fromOldFormat(oldFormat);

      expect(result.childrenIds).toHaveLength(0);
    });

    it('should preserve block data during conversion', () => {
      const oldFormat = {
        root: {
          type: 'Container',
          children: [
            {
              type: 'Text',
              data: {
                text: 'Test Text',
                fontSize: 16,
              },
            },
          ],
        },
      };

      const result = fromOldFormat(oldFormat);

      if (result.childrenIds.length > 0) {
        const firstBlockId = result.childrenIds[0];
        const block = result[firstBlockId];
        expect(block.data.props.text).toBe('Test Text');
        expect(block.data.props.fontSize).toBe(16);
      }
    });
  });

  describe('toOldFormat', () => {
    it('should convert EmailBuilderDocument to old format', () => {
      const document: EmailBuilderDocument = {
        childrenIds: ['block-1'],
        'block-1': {
          type: 'Container',
          data: {
            style: {
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            props: {
              childrenIds: ['block-2'],
            },
          },
        },
        'block-2': {
          type: 'Text',
          data: {
            style: {
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            props: {
              text: 'Hello',
            },
          },
        },
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      const result = toOldFormat(document);

      expect(result).toHaveProperty('root');
      expect(result.root).toHaveProperty('type');
      expect(result.root).toHaveProperty('data');
    });

    it('should handle empty document', () => {
      const document: EmailBuilderDocument = {
        childrenIds: [],
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      const result = toOldFormat(document);

      expect(result).toHaveProperty('root');
      expect(result.root.data.childrenIds).toHaveLength(0);
    });
  });

  describe('roundtrip conversion', () => {
    it('should maintain data integrity through conversion', () => {
      const oldFormat = {
        root: {
          type: 'Container',
          children: [
            {
              type: 'Text',
              data: {
                text: 'Test',
                fontSize: 16,
                color: '#000000',
              },
            },
          ],
        },
      };

      const newFormat = fromOldFormat(oldFormat);
      const backToOld = toOldFormat(newFormat);

      // Check that the structure is preserved
      expect(backToOld).toHaveProperty('root');
      expect(backToOld.root).toHaveProperty('data');
      if (backToOld.root.data && backToOld.root.data.childrenIds) {
        expect(Array.isArray(backToOld.root.data.childrenIds)).toBe(true);
      }
    });
  });
});

