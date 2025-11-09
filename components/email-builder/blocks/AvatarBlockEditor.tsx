/**
 * Avatar Block Editor Component
 */

"use client";

import React from "react";
import type { AvatarBlock } from "@/lib/email-builder/types";

interface AvatarBlockEditorProps {
  block: AvatarBlock;
  blockId: string;
}

export function AvatarBlockEditor({ block }: AvatarBlockEditorProps) {
  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    textAlign: block.data.style.textAlign,
  };

  return (
    <div style={style} className="text-center">
      <img
        src={block.data.props.imageUrl}
        alt={block.data.props.alt || "Avatar"}
        style={{
          width: `${block.data.props.size || 100}px`,
          height: `${block.data.props.size || 100}px`,
          borderRadius: "50%",
          objectFit: "cover",
          display: "inline-block",
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

