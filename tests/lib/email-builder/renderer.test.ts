import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from '@/lib/email-builder/renderer';
import type { EmailBuilderDocument } from '@/lib/email-builder/types';

describe('Email Renderer', () => {
  const createMockDocument = (): EmailBuilderDocument => ({
    childrenIds: ['block-1'],
    'block-1': {
      type: 'Container',
      data: {
        style: {
          backgroundColor: '#ffffff',
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        props: {
          backgroundColor: '#ffffff',
          childrenIds: ['block-2'],
        },
      },
    },
    'block-2': {
      type: 'Text',
      data: {
        style: {
          fontSize: 16,
          color: '#000000',
        },
        props: {
          text: 'Hello World',
          fontSize: 16,
          color: '#000000',
        },
      },
    },
    backdropColor: '#f5f5f5',
    canvasColor: '#ffffff',
  });

  describe('renderToStaticMarkup', () => {
    it('should render a simple document to HTML', () => {
      const document = createMockDocument();
      const html = renderToStaticMarkup(document);

      expect(html).toContain('Hello World');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toMatch(/<html[^>]*>/);
      expect(html).toMatch(/<body[^>]*>/);
    });

    it('should include backdrop color in body style', () => {
      const document = createMockDocument();
      const html = renderToStaticMarkup(document);

      expect(html).toContain('background-color: #f5f5f5');
    });

    it('should render container with background color', () => {
      const document = createMockDocument();
      const html = renderToStaticMarkup(document);

      expect(html).toContain('background-color: #ffffff');
    });

    it('should render text with correct styling', () => {
      const document = createMockDocument();
      const html = renderToStaticMarkup(document);

      expect(html).toContain('font-size: 16px');
      expect(html).toContain('color: #000000');
    });

    it('should handle empty document', () => {
      const document: EmailBuilderDocument = {
        childrenIds: [],
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      const html = renderToStaticMarkup(document);

      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should handle nested containers', () => {
      const document: EmailBuilderDocument = {
        childrenIds: ['block-1'],
        'block-1': {
          type: 'Container',
          data: {
            style: {},
            props: {
              childrenIds: ['block-2'],
            },
          },
        },
        'block-2': {
          type: 'Container',
          data: {
            style: {},
            props: {
              childrenIds: ['block-3'],
            },
          },
        },
        'block-3': {
          type: 'Text',
          data: {
            style: {},
            props: {
              text: 'Nested Text',
            },
          },
        },
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
      };

      const html = renderToStaticMarkup(document);

      expect(html).toContain('Nested Text');
    });
  });
});

