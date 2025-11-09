/**
 * Email Builder Context Provider
 * Provides state and actions to all editor components
 */

"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useRef } from "react";
import {
  editorReducer,
  createInitialState,
  type EditorState,
  type EditorAction,
} from "@/lib/email-builder/state";
import type {
  EmailBuilderDocument,
  EmailBlock,
  BlockType,
} from "@/lib/email-builder/types";

// ============================================================================
// Context Interface
// ============================================================================

interface EmailBuilderContextValue {
  state: EditorState;
  templateId?: string;
  defaultLanguage?: string;
  allStructures?: Record<string, any>;
  
  // Actions
  addBlock: (blockType: BlockType, position: number, parentId?: string, columnIndex?: number) => void;
  updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, newPosition: number, newParentId?: string, columnIndex?: number) => void;
  selectBlock: (blockId: string | null) => void;
  duplicateBlock: (blockId: string) => void;
  undo: () => void;
  redo: () => void;
  setDocument: (document: EmailBuilderDocument) => void;
  markSaved: () => void;
  loadLanguage: (language: string) => Promise<{ success: boolean; error?: string }>;
  saveDocument: () => Promise<{ success: boolean; error?: string }>;
  
  // Helpers
  canUndo: boolean;
  canRedo: boolean;
  getBlock: (blockId: string) => EmailBlock | undefined;
  availableLanguages: string[];
}

const EmailBuilderContext = createContext<EmailBuilderContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface EmailBuilderProviderProps {
  children: React.ReactNode;
  initialDocument?: EmailBuilderDocument;
  onDocumentChange?: (document: EmailBuilderDocument) => void;
  onSave?: (document: EmailBuilderDocument, language?: string) => void | Promise<void>;
  templateId?: string;
  defaultLanguage?: string;
  allStructures?: Record<string, any>;
}

export function EmailBuilderProvider({
  children,
  initialDocument,
  onDocumentChange,
  onSave,
  templateId,
  defaultLanguage,
  allStructures: initialAllStructures,
}: EmailBuilderProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage || "en");
  // Maintain local state for allStructures so we can update it after saves
  // Deep copy on initialization to prevent reference sharing
  const [allStructures, setAllStructures] = useState<Record<string, any> | undefined>(
    initialAllStructures ? JSON.parse(JSON.stringify(initialAllStructures)) : undefined
  );
  
  // Use a ref to store the latest allStructures for synchronous access
  // This ensures loadLanguage always reads the latest value, even after saveDocument updates
  const allStructuresRef = useRef<Record<string, any> | undefined>(
    initialAllStructures ? JSON.parse(JSON.stringify(initialAllStructures)) : undefined
  );
  
  // Update allStructures when prop changes - always deep copy
  useEffect(() => {
    if (initialAllStructures) {
      const deepCopied = JSON.parse(JSON.stringify(initialAllStructures));
      setAllStructures(deepCopied);
      allStructuresRef.current = deepCopied; // Update ref as well
    }
  }, [initialAllStructures]);
  
  // Keep ref in sync with state
  useEffect(() => {
    allStructuresRef.current = allStructures;
  }, [allStructures]);

  const [state, dispatch] = useReducer(
    editorReducer,
    createInitialState(initialDocument)
  );
  
  // Initialize document when initialDocument prop changes
  useEffect(() => {
    if (initialDocument && Object.keys(initialDocument).length > 5) {
      // Only set if document has content (more than just base properties)
      const initialKeys = Object.keys(initialDocument);
      const hasChildren = initialDocument.childrenIds && initialDocument.childrenIds.length > 0;
      
      if (hasChildren) {
        console.log(`[EmailBuilderContext] Initializing document with ${initialKeys.length} keys, ${initialDocument.childrenIds?.length || 0} children`);
        
        // Debug: Check all blocks' content
        console.log(`[EmailBuilderContext] Document structure:`, {
          totalKeys: initialKeys.length,
          childrenIds: initialDocument.childrenIds,
        });
        
        // Check all root-level blocks
        initialDocument.childrenIds.forEach((blockId, index) => {
          const block = initialDocument[blockId] as any;
          if (block) {
            console.log(`[EmailBuilderContext] Root block ${index} (${blockId}):`, {
              type: block.type,
              hasData: !!block.data,
              hasProps: !!block.data?.props,
            });
            
            // If it's a Container, check its children
            if (block.type === 'Container') {
              const childrenIds = block.data?.props?.childrenIds;
              console.log(`[EmailBuilderContext]   Container ${blockId} childrenIds:`, childrenIds);
              
              if (childrenIds && Array.isArray(childrenIds) && childrenIds.length > 0) {
                childrenIds.forEach((childId: string) => {
                  const childBlock = initialDocument[childId] as any;
                  if (childBlock) {
                    const text = childBlock.data?.props?.text || childBlock.data?.props?.heading || 'N/A';
                    console.log(`[EmailBuilderContext]   └─ Child (${childId}):`, {
                      type: childBlock.type,
                      text: text.substring(0, 50),
                      hasData: !!childBlock.data,
                      hasProps: !!childBlock.data?.props,
                    });
                  } else {
                    console.warn(`[EmailBuilderContext]   └─ Child (${childId}) NOT FOUND in document!`);
                    console.log(`[EmailBuilderContext]   Available keys in document:`, Object.keys(initialDocument).slice(0, 10));
                  }
                });
              } else {
                console.warn(`[EmailBuilderContext]   Container ${blockId} has no childrenIds!`);
              }
            }
            
            // If it's a Text or Heading, show the text
            if (block.type === 'Text' || block.type === 'Heading') {
              const text = block.data?.props?.text || block.data?.props?.heading || 'EMPTY';
              console.log(`[EmailBuilderContext]   Text content: "${text.substring(0, 50)}"`);
            }
          }
        });
        
        dispatch({
          type: "SET_DOCUMENT",
          payload: { document: initialDocument },
        });
      }
    }
  }, [initialDocument]); // Only run when initialDocument changes
  
  // Initialize with default language structure if needed (fallback)
  useEffect(() => {
    if (allStructures && defaultLanguage && Object.keys(state.document).length <= 5) {
      // Only initialize if document is mostly empty (just has root properties)
      const defaultStructure = allStructures[defaultLanguage];
      if (defaultStructure && (!initialDocument || Object.keys(initialDocument).length <= 5)) {
        import("@/lib/email-builder/adapter").then(({ fromOldFormat }) => {
          try {
            const converted = fromOldFormat(defaultStructure);
            // Only set if document hasn't been initialized yet
            if (Object.keys(state.document).length <= 5) {
              console.log(`[EmailBuilderContext] Initializing from allStructures fallback`);
              dispatch({
                type: "SET_DOCUMENT",
                payload: { document: converted },
              });
            }
          } catch (error) {
            console.error("Error initializing default language:", error);
          }
        });
      }
    }
  }, [allStructures, defaultLanguage, state.document, initialDocument]); // Only run when these change

  // Notify parent of document changes
  useEffect(() => {
    if (onDocumentChange) {
      onDocumentChange(state.document);
    }
  }, [state.document, onDocumentChange]);

  // Auto-save functionality (optional)
  useEffect(() => {
    if (onSave && state.isDirty) {
      const timer = setTimeout(() => {
        const result = onSave(state.document, currentLanguage);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            dispatch({ type: "MARK_SAVED" });
          }).catch((error) => {
            console.error("Auto-save failed:", error);
          });
        } else {
          dispatch({ type: "MARK_SAVED" });
        }
      }, 30000); // Auto-save after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [state.document, state.isDirty, onSave, currentLanguage]);

  // Action creators
  const addBlock = useCallback(
    (blockType: BlockType, position: number, parentId?: string, columnIndex?: number) => {
      dispatch({
        type: "ADD_BLOCK",
        payload: { blockType, position, parentId, columnIndex },
      });
    },
    []
  );

  const updateBlock = useCallback((blockId: string, updates: Partial<EmailBlock>) => {
    dispatch({
      type: "UPDATE_BLOCK",
      payload: { blockId, updates },
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    dispatch({
      type: "DELETE_BLOCK",
      payload: { blockId },
    });
  }, []);

  const moveBlock = useCallback(
    (blockId: string, newPosition: number, newParentId?: string, columnIndex?: number) => {
      dispatch({
        type: "MOVE_BLOCK",
        payload: { blockId, newPosition, newParentId, columnIndex },
      });
    },
    []
  );

  const selectBlock = useCallback((blockId: string | null) => {
    dispatch({
      type: "SELECT_BLOCK",
      payload: { blockId },
    });
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    dispatch({
      type: "DUPLICATE_BLOCK",
      payload: { blockId },
    });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const setDocument = useCallback((document: EmailBuilderDocument) => {
    console.log(`[setDocument] Setting new document, keys count:`, Object.keys(document).length);
    const sampleBlockIds = document.childrenIds?.slice(0, 1) || [];
    if (sampleBlockIds.length > 0) {
      const sampleBlock = document[sampleBlockIds[0]] as any;
      if (sampleBlock && sampleBlock.data && sampleBlock.data.props) {
        const sampleText = sampleBlock.data.props.text || sampleBlock.data.props.heading || 'N/A';
        console.log(`[setDocument] Sample block text:`, sampleText.substring(0, 50));
      }
    }
    dispatch({
      type: "SET_DOCUMENT",
      payload: { document },
    });
  }, []);

  const markSaved = useCallback(() => {
    dispatch({ type: "MARK_SAVED" });
  }, []);

  // Save document function - returns success/failure
  const saveDocument = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!onSave || !state.document) {
      return { success: false, error: "No save handler or document available" };
    }

    if (!templateId) {
      return { success: false, error: "No template ID available" };
    }

    try {
      // Get the document to save (current language's document)
      const documentToSave = state.document;
      const langToSave = currentLanguage;
      
      // Validate document has content
      if (!documentToSave.childrenIds || documentToSave.childrenIds.length === 0) {
        console.warn("[saveDocument] Document has no children, but saving anyway");
      }
      
      console.log(`[saveDocument] Saving language: ${langToSave}, document keys:`, Object.keys(documentToSave).length);
      
      // Save to database (now saves to TemplateLanguage table)
      const result = await onSave(documentToSave, langToSave);
      
      // Check if save was successful (onSave can return void or Promise<void>, so check if it's an object with error)
      if (result !== undefined && result !== null && typeof result === 'object' && 'error' in result) {
        const errorResult = result as { error?: string };
        if (errorResult.error) {
          console.error("[saveDocument] Save returned error:", errorResult.error);
          return { success: false, error: errorResult.error };
        }
      }
      
      // Update allStructures with the saved document for current language
      // Use state updater function to get the latest allStructures value
      setAllStructures((current) => {
        if (!current) {
          console.warn("[saveDocument] No allStructures available, creating new");
          const newStructures: Record<string, any> = {};
          newStructures[langToSave] = JSON.parse(JSON.stringify(documentToSave));
          allStructuresRef.current = newStructures;
          return newStructures;
        }
        
        console.log(`[saveDocument] Current allStructures languages:`, Object.keys(current));
        
        // Create a completely new object to avoid any reference sharing
        const updatedStructures: Record<string, any> = {};
        
        // Deep copy all existing languages first
        for (const [key, value] of Object.entries(current)) {
          // Deep copy each language to preserve it
          updatedStructures[key] = JSON.parse(JSON.stringify(value));
        }
        
        // Update only the current language with a deep copy of the saved document
        updatedStructures[langToSave] = JSON.parse(JSON.stringify(documentToSave));
        
        console.log(`[saveDocument] Updated language: ${langToSave}, total languages:`, Object.keys(updatedStructures).length);
        
        // Update ref immediately for synchronous access
        allStructuresRef.current = updatedStructures;
        
        return updatedStructures;
      });
      
      dispatch({ type: "MARK_SAVED" });
      return { success: true };
    } catch (error) {
      console.error("[saveDocument] Save failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }, [onSave, state.document, currentLanguage, templateId]);

  // Load language structure - returns success/failure
  const loadLanguage = useCallback(async (language: string): Promise<{ success: boolean; error?: string }> => {
    if (!templateId) {
      return { success: false, error: "No template ID available" };
    }

    // Get the latest allStructures from ref for synchronous access
    // This ensures we always have the latest value, even if called immediately after saveDocument
    const currentStructures = allStructuresRef.current ? JSON.parse(JSON.stringify(allStructuresRef.current)) : null;
    
    if (!currentStructures) {
      console.warn("[loadLanguage] No allStructures available");
      return { success: false, error: "No language structures available" };
    }
    
    console.log("[loadLanguage] Loading language:", language, "Available languages:", Object.keys(currentStructures));
    
    // Get structure for the language from the copied structures
    let langStructure = currentStructures[language];
    let isNewLanguage = false;
    
    if (!langStructure) {
      // Language doesn't exist yet - copy from default language
      const defaultLang = defaultLanguage || "en";
      langStructure = currentStructures[defaultLang];
      
      if (!langStructure) {
        console.warn(`[loadLanguage] No structure found for language ${language} or default ${defaultLang}`);
        // No default either, use initial document
        if (initialDocument) {
          // Deep copy initial document
          const cloned = JSON.parse(JSON.stringify(initialDocument)) as EmailBuilderDocument;
          setDocument(cloned);
          setCurrentLanguage(language);
          return { success: true };
        }
        return { success: false, error: `No structure found for language ${language} or default ${defaultLang}` };
      }
      console.log("[loadLanguage] Language not found, copying from default:", defaultLang);
      isNewLanguage = true;
    }

    // Always create a deep copy to prevent reference sharing
    const deepCopyStructure = (struct: any): any => {
      return JSON.parse(JSON.stringify(struct));
    };

    let finalDocument: EmailBuilderDocument;

    // Check if structure is already in EmailBuilderDocument format
    if (langStructure && typeof langStructure === 'object' && 'childrenIds' in langStructure && !('root' in langStructure)) {
      // Already in correct format - but always deep copy
      console.log("[loadLanguage] Structure already in correct format, deep copying");
      finalDocument = deepCopyStructure(langStructure) as EmailBuilderDocument;
    } else {
      // Convert structure to EmailBuilderDocument format
      try {
        const { fromOldFormat } = await import("@/lib/email-builder/adapter");
        const converted = fromOldFormat(langStructure);
        // Always deep copy the converted structure
        finalDocument = deepCopyStructure(converted) as EmailBuilderDocument;
        console.log("[loadLanguage] Converted and loaded language:", language, "Document keys:", Object.keys(finalDocument).length);
      } catch (error) {
        console.error("[loadLanguage] Error converting structure:", error);
        // If conversion fails, try to use structure directly if it's already in correct format
        if (langStructure && typeof langStructure === 'object' && 'childrenIds' in langStructure) {
          finalDocument = deepCopyStructure(langStructure) as EmailBuilderDocument;
        } else {
          return { success: false, error: "Failed to convert structure format" };
        }
      }
    }

    // If this is a new language, save it to database and update allStructures
    if (isNewLanguage && finalDocument && onSave) {
      try {
        console.log("[loadLanguage] Saving new language to database:", language);
        // Save the new language structure to database
        const saveResult = await onSave(finalDocument, language);
        
        if (saveResult !== undefined && saveResult !== null && typeof saveResult === 'object' && 'error' in saveResult) {
          const errorResult = saveResult as { error?: string };
          if (errorResult.error) {
            console.error("[loadLanguage] Failed to save new language:", errorResult.error);
            return { success: false, error: `Failed to save new language: ${errorResult.error}` };
          }
        }

        // Get the latest allStructures from ref
        const latest = allStructuresRef.current;
        if (!latest) {
          console.warn("[loadLanguage] No allStructures available for new language");
          return { success: false, error: "No allStructures available" };
        }
          
        // Create a completely new object to avoid any reference sharing
        const updatedStructures: Record<string, any> = {};
        
        // Deep copy all existing languages first
        for (const [key, value] of Object.entries(latest)) {
          updatedStructures[key] = JSON.parse(JSON.stringify(value));
        }
        
        // Add the new language with a deep copy
        updatedStructures[language] = JSON.parse(JSON.stringify(finalDocument));
        
        console.log("[loadLanguage] Created new language version:", language, "Available languages:", Object.keys(updatedStructures));
        
        // Update both state and ref
        allStructuresRef.current = updatedStructures;
        setAllStructures(updatedStructures);
      } catch (error) {
        console.error("[loadLanguage] Error saving new language:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: `Failed to save new language: ${errorMessage}` };
      }
    }

    // Verify finalDocument is a deep copy before setting
    console.log(`[loadLanguage] Setting document for language: ${language}`);
    console.log(`[loadLanguage] Final document keys count:`, Object.keys(finalDocument).length);
    
    // Get a sample block ID to verify isolation
    const sampleBlockIds = finalDocument.childrenIds?.slice(0, 2) || [];
    if (sampleBlockIds.length > 0) {
      const sampleBlock = finalDocument[sampleBlockIds[0]] as any;
      if (sampleBlock && sampleBlock.data && sampleBlock.data.props) {
        const sampleText = sampleBlock.data.props.text || sampleBlock.data.props.heading || 'N/A';
        console.log(`[loadLanguage] Sample block text for ${language}:`, sampleText.substring(0, 50));
      }
    }
    
    // Double-check: ensure we're passing a deep copy
    const documentToSet = JSON.parse(JSON.stringify(finalDocument)) as EmailBuilderDocument;
    setDocument(documentToSet);
    setCurrentLanguage(language);
    
    console.log(`[loadLanguage] Document set for language: ${language}`);
    return { success: true };
  }, [defaultLanguage, initialDocument, setDocument, templateId, onSave]);

  // Helper functions
  const getBlock = useCallback(
    (blockId: string): EmailBlock | undefined => {
      const block = state.document[blockId] as EmailBlock | undefined;
      
      // Debug: Log block data when retrieved
      if (block && (block.type === 'Text' || block.type === 'Heading')) {
        const text = (block as any).data?.props?.text || (block as any).data?.props?.heading;
        if (!text || text.trim() === '') {
          console.warn(`[getBlock] Block ${blockId} (${block.type}) has empty text!`, {
            hasData: !!block.data,
            hasProps: !!block.data?.props,
            propsKeys: block.data?.props ? Object.keys(block.data.props) : [],
          });
        }
      }
      
      return block;
    },
    [state.document]
  );

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  
  // Get available languages from allStructures
  const availableLanguages = allStructures ? Object.keys(allStructures) : (defaultLanguage ? [defaultLanguage] : []);

  const value: EmailBuilderContextValue = {
    state,
    templateId,
    defaultLanguage: currentLanguage,
    allStructures,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    selectBlock,
    duplicateBlock,
    undo,
    redo,
    setDocument,
    markSaved,
    loadLanguage,
    saveDocument,
    canUndo,
    canRedo,
    getBlock,
    availableLanguages,
  };

  return (
    <EmailBuilderContext.Provider value={value}>
      {children}
    </EmailBuilderContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useEmailBuilder(): EmailBuilderContextValue {
  const context = useContext(EmailBuilderContext);
  if (!context) {
    throw new Error("useEmailBuilder must be used within EmailBuilderProvider");
  }
  return context;
}


