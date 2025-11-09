/**
 * HTML Block Editor Component
 */

"use client";

import React from "react";
import type { HtmlBlock } from "@/lib/email-builder/types";

interface HtmlBlockEditorProps {
  block: HtmlBlock;
  blockId: string;
}

export function HtmlBlockEditor({ block }: HtmlBlockEditorProps) {
  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
  };

  return (
    <div style={style}>
      <div
        className="border-2 border-dashed border-yellow-400 bg-yellow-50 p-4 rounded"
      >
        <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ HTML Block (Advanced)</p>
        <div
          dangerouslySetInnerHTML={{ __html: block.data.props.html }}
          className="text-sm"
        />
      </div>
    </div>
  );
}

