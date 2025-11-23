/**
 * Email Builder State Management
 * Following Phase 5 requirements - State Management with History
 */

import type {
  EmailBuilderDocument,
  EmailBlock,
  BlockType,
} from "./types";
import { createBlock, generateBlockId } from "./blocks";

// ============================================================================
// State Interface
// ============================================================================

export interface EditorState {
  document: EmailBuilderDocument;
  selectedBlockId: string | null;
  history: EmailBuilderDocument[];
  historyIndex: number;
  isDirty: boolean;
}

// ============================================================================
// Action Types
// ============================================================================

export type EditorAction =
  | { type: "ADD_BLOCK"; payload: { blockType: BlockType; position: number; parentId?: string; columnIndex?: number } }
  | { type: "UPDATE_BLOCK"; payload: { blockId: string; updates: Partial<EmailBlock> } }
  | { type: "DELETE_BLOCK"; payload: { blockId: string } }
  | { type: "MOVE_BLOCK"; payload: { blockId: string; newPosition: number; newParentId?: string; columnIndex?: number } }
  | { type: "SELECT_BLOCK"; payload: { blockId: string | null } }
  | { type: "DUPLICATE_BLOCK"; payload: { blockId: string } }
  | { type: "COPY_BLOCK"; payload: { blockId: string } }
  | { type: "PASTE_BLOCK"; payload: { position: number; parentId?: string; columnIndex?: number } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_DOCUMENT"; payload: { document: EmailBuilderDocument } }
  | { type: "MARK_SAVED" };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Deep clone a document
 */
function cloneDocument(doc: EmailBuilderDocument): EmailBuilderDocument {
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Get parent's childrenIds array
 */
function getParentChildrenIds(
  document: EmailBuilderDocument,
  parentId?: string
): string[] {
  if (!parentId || parentId === "root") {
    return document.childrenIds;
  }

  const parent = document[parentId] as EmailBlock | undefined;
  if (!parent) {
    return document.childrenIds;
  }

  if (parent.type === "Container") {
    return parent.data.props.childrenIds;
  }

  if (parent.type === "Columns") {
    // For columns, we need to know which column - default to first
    // This will be handled by moveBlock with more context
    return parent.data.props.columns[0]?.childrenIds || [];
  }

  return [];
}

/**
 * Remove block from parent's childrenIds
 */
function removeFromParent(
  document: EmailBuilderDocument,
  blockId: string,
  parentId?: string,
  columnIndex?: number
): void {
  if (columnIndex !== undefined && parentId) {
    // Remove from specific column
    const parent = document[parentId] as EmailBlock | undefined;
    if (parent && parent.type === "Columns") {
      const columnsBlock = parent as any;
      if (columnsBlock.data.props.columns?.[columnIndex]?.childrenIds) {
        const column = columnsBlock.data.props.columns[columnIndex];
        const index = column.childrenIds.indexOf(blockId);
        if (index !== -1) {
          column.childrenIds.splice(index, 1);
        }
        return;
      }
    }
  }
  
  const childrenIds = getParentChildrenIds(document, parentId);
  const index = childrenIds.indexOf(blockId);
  if (index !== -1) {
    childrenIds.splice(index, 1);
  }
}

/**
 * Add block to parent's childrenIds at position
 */
function addToParent(
  document: EmailBuilderDocument,
  blockId: string,
  position: number,
  parentId?: string,
  columnIndex?: number
): void {
  if (columnIndex !== undefined && parentId) {
    // Add to specific column
    const parent = document[parentId] as EmailBlock | undefined;
    if (parent && parent.type === "Columns") {
      const columnsBlock = parent as any;
      if (columnsBlock.data.props.columns?.[columnIndex]) {
        const column = columnsBlock.data.props.columns[columnIndex];
        if (!column.childrenIds) {
          column.childrenIds = [];
        }
        column.childrenIds.splice(position, 0, blockId);
        return;
      }
    }
  }
  
  const childrenIds = getParentChildrenIds(document, parentId);
  childrenIds.splice(position, 0, blockId);
}

/**
 * Recursively find and delete all children
 */
function deleteBlockRecursive(
  document: EmailBuilderDocument,
  blockId: string
): void {
  const block = document[blockId] as EmailBlock | undefined;
  if (!block) return;

  // Handle nested children
  if (block.type === "Container") {
    const childrenIds = block.data.props.childrenIds;
    childrenIds.forEach((childId) => {
      deleteBlockRecursive(document, childId);
      delete document[childId];
    });
  } else if (block.type === "Columns") {
    block.data.props.columns.forEach((column) => {
      column.childrenIds.forEach((childId) => {
        deleteBlockRecursive(document, childId);
        delete document[childId];
      });
    });
  }

  delete document[blockId];
}


/**
 * Find parent of a block
 */
function findParent(
  document: EmailBuilderDocument,
  blockId: string
): { parentId?: string; index: number } {
  // Check root children
  const rootIndex = document.childrenIds.indexOf(blockId);
  if (rootIndex !== -1) {
    return { parentId: undefined, index: rootIndex };
  }

  // Check containers and columns
  for (const [id, block] of Object.entries(document)) {
    if (id === "backdropColor" || id === "canvasColor" || id === "textColor" || id === "fontFamily" || id === "childrenIds") {
      continue;
    }

    const emailBlock = block as EmailBlock;
    if (emailBlock.type === "Container") {
      const index = emailBlock.data.props.childrenIds.indexOf(blockId);
      if (index !== -1) {
        return { parentId: id, index };
      }
    } else if (emailBlock.type === "Columns") {
      for (let colIndex = 0; colIndex < emailBlock.data.props.columns.length; colIndex++) {
        const column = emailBlock.data.props.columns[colIndex];
        const index = column.childrenIds.indexOf(blockId);
        if (index !== -1) {
          return { parentId: id, index };
        }
      }
    }
  }

  return { parentId: undefined, index: -1 };
}

/**
 * Find parent of a block including column index
 */
function findParentWithColumn(
  document: EmailBuilderDocument,
  blockId: string
): { parentId?: string; index: number; columnIndex?: number } {
  // Check root children
  const rootIndex = document.childrenIds.indexOf(blockId);
  if (rootIndex !== -1) {
    return { parentId: undefined, index: rootIndex };
  }

  // Check containers and columns
  for (const [id, block] of Object.entries(document)) {
    if (id === "backdropColor" || id === "canvasColor" || id === "textColor" || id === "fontFamily" || id === "childrenIds") {
      continue;
    }

    const emailBlock = block as EmailBlock;
    if (emailBlock.type === "Container") {
      const index = emailBlock.data.props.childrenIds.indexOf(blockId);
      if (index !== -1) {
        return { parentId: id, index };
      }
    } else if (emailBlock.type === "Columns") {
      for (let colIndex = 0; colIndex < emailBlock.data.props.columns.length; colIndex++) {
        const column = emailBlock.data.props.columns[colIndex];
        const index = column.childrenIds.indexOf(blockId);
        if (index !== -1) {
          return { parentId: id, index, columnIndex: colIndex };
        }
      }
    }
  }

  return { parentId: undefined, index: -1 };
}

// ============================================================================
// State Reducer
// ============================================================================

const MAX_HISTORY = 50;

function addToHistory(state: EditorState): EditorState {
  const newHistory = [...state.history.slice(0, state.historyIndex + 1)];
  newHistory.push(cloneDocument(state.document));

  // Limit history size
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  } else {
    state.historyIndex++;
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: Math.min(state.historyIndex, newHistory.length - 1),
    isDirty: true,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "ADD_BLOCK": {
      const { blockType, position, parentId, columnIndex } = action.payload;
      const newBlockId = generateBlockId();
      const newBlock = createBlock(blockType);

      const newDocument = cloneDocument(state.document);
      newDocument[newBlockId] = newBlock;

      addToParent(newDocument, newBlockId, position, parentId, columnIndex);

      const newState = {
        ...state,
        document: newDocument,
        selectedBlockId: newBlockId,
      };

      return addToHistory(newState);
    }

    case "UPDATE_BLOCK": {
      const { blockId, updates } = action.payload;
      
      // Check if block exists
      const block = state.document[blockId] as EmailBlock | undefined;
      if (!block) {
        console.warn(`Block ${blockId} not found`);
        return state;
      }

      // Deep clone the entire document FIRST to prevent any reference sharing
      const newDocument = cloneDocument(state.document);
      
      // Deep clone the updates to ensure no nested references persist
      const clonedUpdates = JSON.parse(JSON.stringify(updates));
      
      // Get the block from the cloned document and merge updates
      // The spread operator will handle shallow merge, but since we've deep cloned
      // both the document and updates, nested objects should be safe
      const existingBlock = newDocument[blockId];
      if (!existingBlock || typeof existingBlock !== 'object' || !('type' in existingBlock)) {
        console.warn(`Block ${blockId} not found in cloned document or is not a valid block`);
        return state;
      }
      newDocument[blockId] = {
        ...(existingBlock as EmailBlock),
        ...clonedUpdates,
      } as EmailBlock;

      const newState = {
        ...state,
        document: newDocument,
      };

      return addToHistory(newState);
    }

    case "DELETE_BLOCK": {
      const { blockId } = action.payload;
      const newDocument = cloneDocument(state.document);

      // Remove from parent
      const { parentId } = findParent(newDocument, blockId);
      removeFromParent(newDocument, blockId, parentId);

      // Delete recursively
      deleteBlockRecursive(newDocument, blockId);

      const newState = {
        ...state,
        document: newDocument,
        selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
      };

      return addToHistory(newState);
    }

    case "MOVE_BLOCK": {
      const { blockId, newPosition, newParentId, columnIndex } = action.payload;
      const newDocument = cloneDocument(state.document);

      // Remove from current parent (need to find which column if in columns)
      const { parentId: oldParentId, columnIndex: oldColumnIndex } = findParentWithColumn(newDocument, blockId);
      removeFromParent(newDocument, blockId, oldParentId, oldColumnIndex);

      // Add to new parent
      addToParent(newDocument, blockId, newPosition, newParentId, columnIndex);

      const newState = {
        ...state,
        document: newDocument,
      };

      return addToHistory(newState);
    }

    case "SELECT_BLOCK": {
      return {
        ...state,
        selectedBlockId: action.payload.blockId,
      };
    }

    case "DUPLICATE_BLOCK": {
      const { blockId } = action.payload;
      const { parentId, index } = findParent(state.document, blockId);

      const idMap = new Map<string, string>();
      const newDocument = cloneDocument(state.document);

      // Function to recursively duplicate block and all children
      const duplicateWithChildren = (blockIdToClone: string): string => {
        const block = newDocument[blockIdToClone] as EmailBlock;
        const newId = generateBlockId();
        idMap.set(blockIdToClone, newId);

        const clonedBlock = JSON.parse(JSON.stringify(block)) as EmailBlock;

        // Handle nested children
        if (clonedBlock.type === "Container") {
          clonedBlock.data.props.childrenIds = clonedBlock.data.props.childrenIds.map(
            (childId) => duplicateWithChildren(childId)
          );
        } else if (clonedBlock.type === "Columns") {
          clonedBlock.data.props.columns = clonedBlock.data.props.columns.map((column) => ({
            childrenIds: column.childrenIds.map((childId) => duplicateWithChildren(childId)),
          }));
        }

        newDocument[newId] = clonedBlock;
        return newId;
      };

      const newBlockId = duplicateWithChildren(blockId);
      addToParent(newDocument, newBlockId, index + 1, parentId);

      const newState = {
        ...state,
        document: newDocument,
        selectedBlockId: newBlockId,
      };

      return addToHistory(newState);
    }

    case "COPY_BLOCK": {
      // Copy action doesn't modify state, but we store it in a way that can be accessed
      // The actual clipboard storage will be handled in the context
      return state;
    }

    case "PASTE_BLOCK": {
      // Paste action will be handled in the context with clipboard data
      // This is a placeholder - actual paste logic needs clipboard data from context
      return state;
    }

    case "UNDO": {
      if (state.historyIndex <= 0) {
        return state;
      }

      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        document: cloneDocument(state.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }

      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        document: cloneDocument(state.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    }

    case "SET_DOCUMENT": {
      const newDocument = cloneDocument(action.payload.document);
      
      // Debug: Verify document has content - check for Text/Heading blocks
      let foundTextBlock = false;
      let sampleText = 'N/A';
      
      // Check all blocks recursively
      const checkBlock = (blockId: string, doc: any, depth = 0): void => {
        const block = doc[blockId];
        if (!block) {
          console.warn(`[editorReducer SET_DOCUMENT] Block ${blockId} not found in document at depth ${depth}`);
          return;
        }
        
        if (block.type === 'Text' || block.type === 'Heading') {
          const text = block.data?.props?.text || block.data?.props?.heading;
          if (text && text.trim() !== '') {
            foundTextBlock = true;
            if (sampleText === 'N/A') {
              sampleText = text.substring(0, 50);
            }
            console.log(`[editorReducer SET_DOCUMENT] Found ${block.type} block (${blockId}) at depth ${depth}: "${text.substring(0, 50)}"`);
          } else {
            console.warn(`[editorReducer SET_DOCUMENT] ${block.type} block (${blockId}) has empty text!`, {
              hasData: !!block.data,
              hasProps: !!block.data?.props,
              propsKeys: block.data?.props ? Object.keys(block.data.props) : [],
            });
          }
        }
        
        // Check children if Container
        if (block.type === 'Container') {
          const childrenIds = block.data?.props?.childrenIds;
          if (childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
            console.log(`[editorReducer SET_DOCUMENT] Container ${blockId} at depth ${depth} has ${childrenIds.length} children:`, childrenIds);
            childrenIds.forEach((childId: string) => {
              checkBlock(childId, doc, depth + 1);
            });
          } else {
            console.warn(`[editorReducer SET_DOCUMENT] Container ${blockId} at depth ${depth} has no childrenIds!`, {
              hasData: !!block.data,
              hasProps: !!block.data?.props,
              childrenIds: childrenIds,
            });
          }
        }
      };
      
      newDocument.childrenIds?.forEach((blockId: string) => {
        checkBlock(blockId, newDocument, 0);
      });
      
      console.log(`[editorReducer SET_DOCUMENT] Setting document:`, {
        keys: Object.keys(newDocument).length,
        childrenCount: newDocument.childrenIds?.length || 0,
        foundTextBlock,
        sampleText,
      });
      
      return {
        ...state,
        document: newDocument,
        history: [newDocument],
        historyIndex: 0,
        isDirty: false,
      };
    }

    case "MARK_SAVED": {
      return {
        ...state,
        isDirty: false,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Initial State Factory
// ============================================================================

export function createInitialState(
  initialDocument?: EmailBuilderDocument
): EditorState {
  const defaultDocument: EmailBuilderDocument = {
    backdropColor: "#F8F8F8",
    canvasColor: "#FFFFFF",
    textColor: "#242424",
    fontFamily: "MODERN_SANS",
    childrenIds: [],
  };

  const document = initialDocument || defaultDocument;
  const cloned = cloneDocument(document);

  return {
    document: cloned,
    selectedBlockId: null,
    history: [cloned],
    historyIndex: 0,
    isDirty: false,
  };
}

