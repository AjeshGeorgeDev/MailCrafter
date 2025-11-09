/**
 * Heading Block Editor Component
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { HeadingBlock } from "@/lib/email-builder/types";
import { useVariableInserter } from "@/components/templates/VariableInserter";
import { Button } from "@/components/ui/button";
import { Variable } from "lucide-react";

interface HeadingBlockEditorProps {
  block: HeadingBlock;
  blockId: string;
}

export function HeadingBlockEditor({ block, blockId }: HeadingBlockEditorProps) {
  const { updateBlock, state } = useEmailBuilder();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get current block from state to ensure we have the latest data
  const currentBlock = (state.document[blockId] as HeadingBlock | undefined) || block;
  const initialText = currentBlock?.data?.props?.text || '';
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debug: Log block data on mount and when it changes
  useEffect(() => {
    const blockInState = state.document[blockId] as HeadingBlock | undefined;
    console.log(`[HeadingBlockEditor] Block ${blockId} state:`, {
      exists: !!blockInState,
      hasData: !!blockInState?.data,
      hasProps: !!blockInState?.data?.props,
      text: blockInState?.data?.props?.text || 'EMPTY',
      currentTextState: text,
    });
  }, [blockId, state.document]);
  
  // Sync text state with document state when it changes
  useEffect(() => {
    const blockInState = state.document[blockId] as HeadingBlock | undefined;
    if (blockInState && blockInState.data && blockInState.data.props) {
      const currentText = blockInState.data.props.text || '';
      if (currentText !== text && !isEditing) {
        console.log(`[HeadingBlockEditor] Syncing text for block ${blockId}: "${currentText.substring(0, 30)}"`);
        setText(currentText);
      }
    } else if (!blockInState) {
      console.warn(`[HeadingBlockEditor] Block ${blockId} not found in state.document!`);
    }
  }, [state.document, blockId, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    // Get the current block from state to ensure we're working with the latest version
    const currentBlock = state.document[blockId] as HeadingBlock | undefined;
    if (!currentBlock) {
      console.warn(`[HeadingBlockEditor] Block ${blockId} not found in state`);
      return;
    }
    
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
    if (!inputRef.current) return;
    
    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    setText(newText);
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      input.focus();
      const newCursorPos = start + variable.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
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

  const HeadingTag = `h${currentBlock.data.props.level}` as keyof React.JSX.IntrinsicElements;

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
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur();
            }
            if (e.key === "Escape") {
              const currentBlock = (state.document[blockId] as HeadingBlock | undefined) || block;
              setText(currentBlock.data.props.text || '');
              setIsEditing(false);
            }
          }}
          className="w-full border rounded p-2 outline-none font-bold"
          style={{ fontSize: style.fontSize }}
          autoFocus
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
      <HeadingTag style={style}>
        {text || "Double-click to edit"}
      </HeadingTag>
    </div>
  );
}

