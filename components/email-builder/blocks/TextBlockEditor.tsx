/**
 * Text Block Editor Component
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { TextBlock } from "@/lib/email-builder/types";
import { useVariableInserter } from "@/components/templates/VariableInserter";
import { Button } from "@/components/ui/button";
import { Variable } from "lucide-react";

interface TextBlockEditorProps {
  block: TextBlock;
  blockId: string;
}

export function TextBlockEditor({ block, blockId }: TextBlockEditorProps) {
  const { updateBlock, state } = useEmailBuilder();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get current block from state to ensure we have the latest data
  const currentBlock = (state.document[blockId] as TextBlock | undefined) || block;
  const initialText = currentBlock?.data?.props?.text || '';
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Debug: Log block data on mount and when it changes
  useEffect(() => {
    const blockInState = state.document[blockId] as TextBlock | undefined;
    console.log(`[TextBlockEditor] Block ${blockId} state:`, {
      exists: !!blockInState,
      hasData: !!blockInState?.data,
      hasProps: !!blockInState?.data?.props,
      text: blockInState?.data?.props?.text || 'EMPTY',
      currentTextState: text,
    });
  }, [blockId, state.document]);
  
  // Sync text state with document state when it changes
  useEffect(() => {
    const blockInState = state.document[blockId] as TextBlock | undefined;
    if (blockInState && blockInState.data && blockInState.data.props) {
      const currentText = blockInState.data.props.text || '';
      if (currentText !== text && !isEditing) {
        console.log(`[TextBlockEditor] Syncing text for block ${blockId}: "${currentText.substring(0, 30)}"`);
        setText(currentText);
      }
    } else if (!blockInState) {
      console.warn(`[TextBlockEditor] Block ${blockId} not found in state.document!`);
    }
  }, [state.document, blockId, text, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    // Get the current block from state to ensure we're working with the latest version
    const currentBlock = state.document[blockId] as TextBlock | undefined;
    if (!currentBlock) {
      console.warn(`[TextBlockEditor] Block ${blockId} not found in state`);
      return;
    }
    
    // Only pass the changed properties, not the entire block
    // This prevents reference sharing issues
    updateBlock(blockId, {
      data: {
        ...currentBlock.data,
        props: {
          ...currentBlock.data.props,
          text,
        },
      },
    });
  };

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    setText(newText);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const { VariableInserter, openVariableInserter } = useVariableInserter(handleInsertVariable);

  const style = {
    padding: `${currentBlock.data.style.padding?.top || 0}px ${currentBlock.data.style.padding?.right || 0}px ${currentBlock.data.style.padding?.bottom || 0}px ${currentBlock.data.style.padding?.left || 0}px`,
    backgroundColor: currentBlock.data.style.backgroundColor || undefined,
    color: currentBlock.data.style.color || undefined,
    fontSize: currentBlock.data.style.fontSize ? `${currentBlock.data.style.fontSize}px` : undefined,
    fontWeight: currentBlock.data.style.fontWeight,
    textAlign: currentBlock.data.style.textAlign,
  };

  if (isEditing) {
    return (
      <div style={style}>
        <div className="flex items-center justify-end mb-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            type="button" 
            className="text-xs"
            onClick={() => openVariableInserter?.()}
          >
            <Variable className="h-3.5 w-3.5 mr-1.5" />
            Insert Variable
          </Button>
          <span className="text-xs text-gray-500">or press Ctrl+K</span>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleBlur();
            }
            if (e.key === "Escape") {
              const currentBlock = (state.document[blockId] as TextBlock | undefined) || block;
              setText(currentBlock.data.props.text || '');
              setIsEditing(false);
            }
          }}
          className="w-full border rounded p-2 outline-none resize-none"
          autoFocus
          rows={3}
        />
        <VariableInserter />
      </div>
    );
  }

  return (
    <div
      style={style}
      onDoubleClick={() => setIsEditing(true)}
      className="cursor-text"
    >
      <p
        dangerouslySetInnerHTML={{ __html: text || "Double-click to edit" }}
      />
    </div>
  );
}

