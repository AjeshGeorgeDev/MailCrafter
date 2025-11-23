/**
 * Text Block Editor Component
 */

"use client";

import React, { useState, useEffect } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { TextBlock } from "@/lib/email-builder/types";
import { RichTextEditor } from "./RichTextEditor";

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
        <RichTextEditor
          content={text}
          onChange={(html) => {
            setText(html);
            // Auto-save on change
            const currentBlock = state.document[blockId] as TextBlock | undefined;
            if (currentBlock) {
              updateBlock(blockId, {
                data: {
                  ...currentBlock.data,
                  props: {
                    ...currentBlock.data.props,
                    text: html,
                  },
                },
              });
            }
          }}
          onEscape={() => {
            handleBlur();
          }}
          placeholder="Double-click to edit text..."
          className="w-full"
        />
        <div className="flex items-center justify-end mt-2 gap-2">
          <button
            onClick={handleBlur}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Press Escape or click outside to finish editing
          </button>
        </div>
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

