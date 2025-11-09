/**
 * Container Block Editor Component
 */

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailBuilder } from "../EmailBuilderContext";
import { BlockRenderer } from "../BlockRenderer";
import type { ContainerBlock, BlockType } from "@/lib/email-builder/types";
import { BLOCK_DEFINITIONS } from "@/lib/email-builder/blocks";

interface ContainerBlockEditorProps {
  block: ContainerBlock;
  blockId: string;
  parentId?: string;
}

function SortableBlockInContainer({ blockId, children }: { blockId: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: blockId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

function AddBlockButton({ parentId, className = "" }: { parentId: string; className?: string }) {
  const { addBlock, state } = useEmailBuilder();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAddBlock = (blockType: BlockType) => {
    const container = state.document[parentId] as any;
    const position = container?.data?.props?.childrenIds?.length || 0;
    addBlock(blockType, position, parentId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <Plus className="h-3 w-3" />
      </Button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg p-2 z-50 min-w-[200px]">
            <div className="grid grid-cols-2 gap-1">
              {BLOCK_DEFINITIONS.map((block) => (
                <Button
                  key={block.type}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddBlock(block.type as BlockType)}
                  className="justify-start text-xs h-8"
                >
                  <span className="mr-1">{block.icon}</span>
                  {block.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ContainerBlockEditor({
  block,
  blockId,
  parentId,
}: ContainerBlockEditorProps) {
  const { state, selectBlock } = useEmailBuilder();
  const childrenIds = block.data.props.childrenIds || [];

  const dropZoneId = `container-${blockId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    data: {
      type: "container-drop-zone",
      containerId: blockId,
    },
  });

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || (block.data.props as any)?.backgroundColor || undefined,
  };

  return (
    <div style={style}>
      <div
        ref={setNodeRef}
        className={`min-h-[100px] transition-colors relative ${
          isOver ? "bg-blue-50 border-2 border-blue-300 border-dashed rounded" : ""
        }`}
      >
        {childrenIds.length === 0 ? (
          <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded relative">
            <p className="text-sm mb-2">Container - Drag blocks here</p>
            <AddBlockButton parentId={blockId} />
          </div>
        ) : (
          <SortableContext items={childrenIds} strategy={verticalListSortingStrategy}>
            {childrenIds.map((childId, index) => (
              <React.Fragment key={childId}>
                <SortableBlockInContainer blockId={childId}>
                  <BlockRenderer
                    blockId={childId}
                    onSelect={() => selectBlock(childId)}
                    isSelected={state.selectedBlockId === childId}
                    parentId={blockId}
                  />
                </SortableBlockInContainer>
                {index < childrenIds.length - 1 && (
                  <div className="h-4 flex items-center justify-center relative">
                    <div className="h-0.5 w-full bg-transparent hover:bg-blue-300 transition-colors" />
                    <AddBlockButton parentId={blockId} className="absolute" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </SortableContext>
        )}
        {/* Add block button at the end */}
        <div className="pt-2 flex justify-center">
          <AddBlockButton parentId={blockId} />
        </div>
      </div>
    </div>
  );
}

