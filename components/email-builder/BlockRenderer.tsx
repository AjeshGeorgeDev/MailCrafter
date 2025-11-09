/**
 * Block Renderer Component
 * Renders individual blocks with editor controls
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailBuilder } from "./EmailBuilderContext";
import { cn } from "@/lib/utils";
import type { EmailBlock } from "@/lib/email-builder/types";

// Individual block content renderers
import { TextBlockEditor } from "./blocks/TextBlockEditor";
import { HeadingBlockEditor } from "./blocks/HeadingBlockEditor";
import { ImageBlockEditor } from "./blocks/ImageBlockEditor";
import { ButtonBlockEditor } from "./blocks/ButtonBlockEditor";
import { DividerBlockEditor } from "./blocks/DividerBlockEditor";
import { SpacerBlockEditor } from "./blocks/SpacerBlockEditor";
import { ContainerBlockEditor } from "./blocks/ContainerBlockEditor";
import { ColumnsBlockEditor } from "./blocks/ColumnsBlockEditor";
import { AvatarBlockEditor } from "./blocks/AvatarBlockEditor";
import { HtmlBlockEditor } from "./blocks/HtmlBlockEditor";
import { SocialLinksBlockEditor } from "./blocks/SocialLinksBlockEditor";
import { ListBlockEditor } from "./blocks/ListBlockEditor";
import { HeroBlockEditor } from "./blocks/HeroBlockEditor";
import { QuoteBlockEditor } from "./blocks/QuoteBlockEditor";

interface BlockRendererProps {
  blockId: string;
  onSelect: () => void;
  isSelected: boolean;
  parentId?: string; // For nested blocks
  columnIndex?: number; // For columns
}

export function BlockRenderer({
  blockId,
  onSelect,
  isSelected,
  parentId,
  columnIndex,
}: BlockRendererProps) {
  const { getBlock, deleteBlock, duplicateBlock, templateId } = useEmailBuilder();
  const block = getBlock(blockId);

  if (!block) {
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: blockId,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Merge drag listeners - make the whole block draggable via drag handle
  const dragHandleListeners = {
    ...listeners,
    onClick: (e: React.MouseEvent) => {
      // Don't trigger drag on click, only on drag
      e.stopPropagation();
    },
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "Text":
        return <TextBlockEditor block={block} blockId={blockId} />;
      case "Heading":
        return <HeadingBlockEditor block={block} blockId={blockId} />;
      case "Image":
        return <ImageBlockEditor block={block} blockId={blockId} templateId={templateId} />;
      case "Button":
        return <ButtonBlockEditor block={block} blockId={blockId} />;
      case "Divider":
        return <DividerBlockEditor block={block} blockId={blockId} />;
      case "Spacer":
        return <SpacerBlockEditor block={block} blockId={blockId} />;
      case "Container":
        return (
          <ContainerBlockEditor
            block={block}
            blockId={blockId}
            parentId={parentId}
          />
        );
      case "Columns":
        return (
          <ColumnsBlockEditor
            block={block}
            blockId={blockId}
            parentId={parentId}
          />
        );
      case "Avatar":
        return <AvatarBlockEditor block={block} blockId={blockId} />;
      case "HTML":
        return <HtmlBlockEditor block={block} blockId={blockId} />;
      case "SocialLinks":
        return <SocialLinksBlockEditor block={block} blockId={blockId} />;
      case "List":
        return <ListBlockEditor block={block} blockId={blockId} />;
      case "Hero":
        return <HeroBlockEditor block={block} blockId={blockId} templateId={templateId} />;
      case "Quote":
        return <QuoteBlockEditor block={block} blockId={blockId} />;
      default:
        return <div>Unknown block type: {(block as EmailBlock).type}</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      <div
        className={cn(
          "relative", // No margin needed since handle is absolutely positioned
          isSelected && "bg-blue-50/50",
          "hover:bg-gray-50/50 transition-colors"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* Block Toolbar - Show on hover/select */}
        {(isSelected || isDragging) && (
          <div className="absolute -top-10 right-0 flex gap-1 z-20 bg-white border rounded shadow-sm p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                duplicateBlock(blockId);
              }}
              title="Duplicate"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                deleteBlock(blockId);
              }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div
              {...attributes}
              {...dragHandleListeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              title="Drag to reorder"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        )}

        {/* Drag handle - Only shows when selected */}
        {isSelected && (
          <div
            {...attributes}
            {...dragHandleListeners}
            className="absolute left-0 top-0 cursor-grab active:cursor-grabbing p-1.5 hover:bg-blue-50 rounded-br z-20 bg-white border-r border-b border-gray-300 shadow-sm"
            title="Drag to reorder"
            onMouseDown={(e) => {
              // Prevent block selection when starting drag
              e.stopPropagation();
            }}
          >
            <GripVertical className="h-3.5 w-3.5 text-gray-500" />
          </div>
        )}

        {/* Block Content */}
        <div className="min-h-[40px]">
          {renderBlockContent()}
        </div>

        {/* Block Type Label - Show on hover */}
        {!isSelected && (
          <div className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs px-2 py-1 rounded-br">
            {block.type}
          </div>
        )}
      </div>
    </div>
  );
}

