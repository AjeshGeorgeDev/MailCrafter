/**
 * Columns Block Editor Component
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
import type { ColumnsBlock, BlockType } from "@/lib/email-builder/types";
import { BLOCK_DEFINITIONS } from "@/lib/email-builder/blocks";

interface ColumnsBlockEditorProps {
  block: ColumnsBlock;
  blockId: string;
  parentId?: string;
}

function SortableBlockInColumn({ blockId, children }: { blockId: string; children: React.ReactNode }) {
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

function ColumnDropZone({
  columnIndex,
  blockId,
  childrenIds,
  children,
}: {
  columnIndex: number;
  blockId: string;
  childrenIds: string[];
  children: React.ReactNode;
}) {
  const dropZoneId = `column-${blockId}-${columnIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    data: {
      type: "column-drop-zone",
      columnBlockId: blockId,
      columnIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] transition-colors ${
        isOver ? "bg-blue-50 border-2 border-blue-300 border-dashed rounded" : ""
      }`}
    >
      {children}
    </div>
  );
}

function AddBlockToColumnButton({ 
  blockId, 
  columnIndex, 
  className = "" 
}: { 
  blockId: string; 
  columnIndex: number; 
  className?: string;
}) {
  const { addBlock, state } = useEmailBuilder();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleAddBlock = (blockType: BlockType) => {
    const columnsBlock = state.document[blockId] as any;
    const position = columnsBlock?.data?.props?.columns?.[columnIndex]?.childrenIds?.length || 0;
    addBlock(blockType, position, blockId, columnIndex);
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

export function ColumnsBlockEditor({
  block,
  blockId,
  parentId,
}: ColumnsBlockEditorProps) {
  const { state, selectBlock } = useEmailBuilder();
  const columns = block.data.props.columns || [];

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
  };

  const columnWidth = `${100 / columns.length}%`;

  return (
    <div style={style}>
      <div className="flex gap-4">
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            style={{
              width: columnWidth,
            }}
            className="border-2 border-dashed border-gray-300 p-2"
          >
            <ColumnDropZone
              columnIndex={colIndex}
              blockId={blockId}
              childrenIds={column.childrenIds}
            >
              {column.childrenIds.length === 0 ? (
                <div className="text-center text-gray-400 py-4 text-xs relative">
                  <p className="mb-2">Column {colIndex + 1} - Drag blocks here</p>
                  <AddBlockToColumnButton blockId={blockId} columnIndex={colIndex} />
                </div>
              ) : (
                <SortableContext items={column.childrenIds} strategy={verticalListSortingStrategy}>
                  {column.childrenIds.map((childId, index) => (
                    <React.Fragment key={childId}>
                      <SortableBlockInColumn blockId={childId}>
                        <BlockRenderer
                          blockId={childId}
                          onSelect={() => selectBlock(childId)}
                          isSelected={state.selectedBlockId === childId}
                          parentId={blockId}
                          columnIndex={colIndex}
                        />
                      </SortableBlockInColumn>
                      {index < column.childrenIds.length - 1 && (
                        <div className="h-4 flex items-center justify-center relative">
                          <div className="h-0.5 w-full bg-transparent hover:bg-blue-300 transition-colors" />
                          <AddBlockToColumnButton blockId={blockId} columnIndex={colIndex} className="absolute" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </SortableContext>
              )}
            </ColumnDropZone>
            {/* Add block button at the end of column */}
            <div className="pt-2 flex justify-center">
              <AddBlockToColumnButton blockId={blockId} columnIndex={colIndex} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

