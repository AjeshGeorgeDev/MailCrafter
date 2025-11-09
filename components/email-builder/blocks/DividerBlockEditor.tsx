/**
 * Divider Block Editor Component
 */

"use client";

import React from "react";
import type { DividerBlock } from "@/lib/email-builder/types";

interface DividerBlockEditorProps {
  block: DividerBlock;
  blockId: string;
}

export function DividerBlockEditor({ block }: DividerBlockEditorProps) {
  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
  };

  return (
    <div style={style}>
      <hr
        style={{
          border: "none",
          borderTop: `${block.data.props.lineHeight || 1}px solid ${block.data.props.lineColor || "#E5E7EB"}`,
          margin: 0,
        }}
      />
    </div>
  );
}

