/**
 * Keyboard Shortcuts Hook
 * Handles all keyboard shortcuts for the editor
 */

import { useEffect } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";

export function useKeyboardShortcuts() {
  const {
    state,
    undo,
    redo,
    deleteBlock,
    duplicateBlock,
    selectBlock,
    canUndo,
    canRedo,
  } = useEmailBuilder();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+X for text editing
        if (
          (event.ctrlKey || event.metaKey) &&
          (event.key === "z" ||
            event.key === "y" ||
            event.key === "c" ||
            event.key === "v" ||
            event.key === "x")
        ) {
          return;
        }
        
        // For other shortcuts, continue if not in text input
        return;
      }

      // Ctrl+Z or Cmd+Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z: Redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Delete or Backspace: Delete selected block
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        state.selectedBlockId
      ) {
        event.preventDefault();
        deleteBlock(state.selectedBlockId);
        selectBlock(null);
        return;
      }

      // Ctrl+D or Cmd+D: Duplicate selected block
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        if (state.selectedBlockId) {
          duplicateBlock(state.selectedBlockId);
        }
        return;
      }

      // Escape: Clear selection
      if (event.key === "Escape") {
        event.preventDefault();
        selectBlock(null);
        return;
      }

      // Ctrl+C or Cmd+C: Copy (when block selected)
      if ((event.ctrlKey || event.metaKey) && event.key === "c" && state.selectedBlockId) {
        // Copy to clipboard will be handled separately
        // For now, just prevent default
        return;
      }

      // Ctrl+V or Cmd+V: Paste
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        // Paste will be handled separately
        // For now, just prevent default
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.selectedBlockId, canUndo, canRedo, undo, redo, deleteBlock, duplicateBlock, selectBlock]);
}

