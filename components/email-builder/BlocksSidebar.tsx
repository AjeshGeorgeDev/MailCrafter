/**
 * Blocks Sidebar Component
 * Displays draggable block types organized by category
 */

"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { BLOCK_DEFINITIONS, getBlocksByCategory } from "@/lib/email-builder/blocks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEmailBuilder } from "./EmailBuilderContext";
import type { BlockType } from "@/lib/email-builder/types";

interface DraggableBlockItemProps {
  blockType: string;
  label: string;
  icon: string;
  onClick: () => void;
}

function DraggableBlockItem({ blockType, label, icon, onClick }: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-block-${blockType}`,
    data: {
      type: "block-type",
      blockType,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "z-50"
      )}
    >
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={onClick}
        onMouseDown={(e) => {
          // Allow drag to start
          e.stopPropagation();
        }}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Button>
    </div>
  );
}

export function BlocksSidebar() {
  const { addBlock, state } = useEmailBuilder();
  const blocksByCategory = getBlocksByCategory();

  const handleAddBlock = (blockType: BlockType) => {
    // Add to end of root children
    const position = state.document.childrenIds.length;
    addBlock(blockType, position);
  };

  return (
    <div className="w-64 border-r bg-white p-4 overflow-y-auto h-full">
      <h3 className="font-semibold mb-4 text-lg">Blocks</h3>
      
      {Object.entries(blocksByCategory).map(([category, blocks]) => (
        <div key={category} className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
            {category}
          </h4>
          <div className="space-y-2">
            {blocks.map((block) => (
              <DraggableBlockItem
                key={block.type}
                blockType={block.type}
                label={block.label}
                icon={block.icon}
                onClick={() => handleAddBlock(block.type as BlockType)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

