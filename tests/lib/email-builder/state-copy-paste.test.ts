/**
 * Tests for Copy/Paste State Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { editorReducer, createInitialState } from '@/lib/email-builder/state';
import type { EditorState, EditorAction } from '@/lib/email-builder/state';
import type { EmailBuilderDocument, EmailBlock } from '@/lib/email-builder/types';

describe('Copy/Paste State Management', () => {
  let initialState: EditorState;

  beforeEach(() => {
    initialState = createInitialState({
      childrenIds: ['block-1'],
      'block-1': {
        type: 'Text',
        data: {
          style: {
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
          },
          props: {
            text: 'Test text',
          },
        },
      },
      backdropColor: '#ffffff',
      canvasColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'MODERN_SANS',
    });
  });

  describe('COPY_BLOCK action', () => {
    it('should not modify state when copying', () => {
      const action: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'block-1' },
      };

      const newState = editorReducer(initialState, action);

      // Copy action should not modify state
      expect(newState).toEqual(initialState);
      expect(newState.document).toEqual(initialState.document);
    });

    it('should handle copying non-existent block gracefully', () => {
      const action: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'non-existent' },
      };

      const newState = editorReducer(initialState, action);

      // Should not throw and should return same state
      expect(newState).toEqual(initialState);
    });
  });

  describe('PASTE_BLOCK action', () => {
    it('should not modify state directly (paste handled in context)', () => {
      const action: EditorAction = {
        type: 'PASTE_BLOCK',
        payload: { position: 0 },
      };

      const newState = editorReducer(initialState, action);

      // Paste action placeholder should not modify state
      // Actual paste logic is in context
      expect(newState).toEqual(initialState);
    });

    it('should handle paste at different positions', () => {
      const action1: EditorAction = {
        type: 'PASTE_BLOCK',
        payload: { position: 0 },
      };

      const action2: EditorAction = {
        type: 'PASTE_BLOCK',
        payload: { position: 1 },
      };

      const state1 = editorReducer(initialState, action1);
      const state2 = editorReducer(initialState, action2);

      // Both should return same state (placeholder)
      expect(state1).toEqual(state2);
    });
  });

  describe('Integration with other actions', () => {
    it('should maintain history after copy action', () => {
      const copyAction: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'block-1' },
      };

      const stateAfterCopy = editorReducer(initialState, copyAction);

      // History should remain unchanged
      expect(stateAfterCopy.history).toEqual(initialState.history);
      expect(stateAfterCopy.historyIndex).toBe(initialState.historyIndex);
    });

    it('should work with block selection', () => {
      const selectAction: EditorAction = {
        type: 'SELECT_BLOCK',
        payload: { blockId: 'block-1' },
      };

      const copyAction: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'block-1' },
      };

      const stateAfterSelect = editorReducer(initialState, selectAction);
      const stateAfterCopy = editorReducer(stateAfterSelect, copyAction);

      // Selection should remain
      expect(stateAfterCopy.selectedBlockId).toBe('block-1');
    });
  });

  describe('Nested block copying', () => {
    it('should handle copying container blocks', () => {
      const containerState: EditorState = createInitialState({
        childrenIds: ['container-1'],
        'container-1': {
          type: 'Container',
          data: {
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            props: {
              childrenIds: ['child-1'],
            },
          },
        },
        'child-1': {
          type: 'Text',
          data: {
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            props: {
              text: 'Child text',
            },
          },
        },
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
        textColor: '#000000',
        fontFamily: 'MODERN_SANS',
      });

      const action: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'container-1' },
      };

      const newState = editorReducer(containerState, action);

      // Should not modify state
      expect(newState.document).toEqual(containerState.document);
    });

    it('should handle copying columns blocks', () => {
      const columnsState: EditorState = createInitialState({
        childrenIds: ['columns-1'],
        'columns-1': {
          type: 'Columns',
          data: {
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            props: {
              columns: [
                { childrenIds: ['col1-child'] },
                { childrenIds: ['col2-child'] },
              ],
            },
          },
        },
        'col1-child': {
          type: 'Text',
          data: {
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            props: {
              text: 'Column 1',
            },
          },
        },
        'col2-child': {
          type: 'Text',
          data: {
            style: {
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            props: {
              text: 'Column 2',
            },
          },
        },
        backdropColor: '#ffffff',
        canvasColor: '#ffffff',
        textColor: '#000000',
        fontFamily: 'MODERN_SANS',
      });

      const action: EditorAction = {
        type: 'COPY_BLOCK',
        payload: { blockId: 'columns-1' },
      };

      const newState = editorReducer(columnsState, action);

      // Should not modify state
      expect(newState.document).toEqual(columnsState.document);
    });
  });
});

