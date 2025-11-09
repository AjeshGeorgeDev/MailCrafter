/**
 * Spacer Block Editor Component
 */

"use client";

import React from "react";
import type { SpacerBlock } from "@/lib/email-builder/types";

interface SpacerBlockEditorProps {
  block: SpacerBlock;
  blockId: string;
}

export function SpacerBlockEditor({ block }: SpacerBlockEditorProps) {
  return (
    <div
      style={{
        height: `${block.data.props.height || 20}px`,
        backgroundColor: "transparent",
      }}
    />
  );
}

