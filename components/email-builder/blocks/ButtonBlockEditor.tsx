/**
 * Button Block Editor Component
 */

"use client";

import React, { useState } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { ButtonBlock } from "@/lib/email-builder/types";

interface ButtonBlockEditorProps {
  block: ButtonBlock;
  blockId: string;
}

export function ButtonBlockEditor({ block, blockId }: ButtonBlockEditorProps) {
  const { updateBlock } = useEmailBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.data.props.text);

  const handleBlur = () => {
    setIsEditing(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          text,
        },
      },
    });
  };

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    textAlign: block.data.style.textAlign,
  };

  const buttonStyle = {
    backgroundColor: block.data.props.buttonColor,
    color: block.data.props.buttonTextColor,
    padding: "12px 24px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "inline-block",
    textDecoration: "none",
    fontWeight: "bold",
    width: block.data.props.fullWidth ? "100%" : "auto",
  };

  if (isEditing) {
    return (
      <div style={style} className="text-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur();
            }
            if (e.key === "Escape") {
              setText(block.data.props.text);
              setIsEditing(false);
            }
          }}
          className="border-none outline-none text-center"
          style={buttonStyle}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div style={style} className="text-center">
      <button
        style={buttonStyle}
        onDoubleClick={() => setIsEditing(true)}
        className="cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        {text || "Double-click to edit"}
      </button>
    </div>
  );
}

