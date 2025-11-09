/**
 * Canvas Component
 * Main editing area with drag & drop support
 */

"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
  type Active,
  type Over,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEmailBuilder } from "./EmailBuilderContext";
import type { BlockType } from "@/lib/email-builder/types";
import { BlockRenderer } from "./BlockRenderer";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function DropZone({ id, children, className }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "drop-zone",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] transition-colors",
        isOver && "bg-blue-50 border-2 border-blue-300 border-dashed rounded",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SortableBlockWrapperProps {
  blockId: string;
  children: React.ReactNode;
}

function SortableBlockWrapper({ blockId, children }: SortableBlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: blockId,
  });

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

export function Canvas() {
  const { state, addBlock, moveBlock, selectBlock } = useEmailBuilder();
  const { document } = state;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require only 5px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Visual feedback handled by isDragging state
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback handled by isOver state in DropZone
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Case 1: Dragging from sidebar (adding new block)
    if (active.id.toString().startsWith("sidebar-block-")) {
      const blockType = active.data.current?.blockType as BlockType;
      if (!blockType) return;

      // Determine drop position and parent
      let position = 0;
      let parentId: string | undefined = undefined;
      let columnIndex: number | undefined = undefined;

      const overId = over.id.toString();
      const overData = over.data.current;

      // Check if dropped into a container
      if (overData?.type === "container-drop-zone" && overData.containerId) {
        const containerId = overData.containerId;
        parentId = containerId;
        const parent = document[containerId] as any;
        if (parent?.data?.props?.childrenIds) {
          position = parent.data.props.childrenIds.length;
        }
      }
      // Check if dropped into a column
      else if (overData?.type === "column-drop-zone" && overData.columnBlockId && typeof overData.columnIndex === 'number') {
        const colBlockId = overData.columnBlockId;
        const colIndex = overData.columnIndex;
        parentId = colBlockId;
        columnIndex = colIndex;
        const parent = document[colBlockId] as any;
        if (parent?.data?.props?.columns?.[colIndex]?.childrenIds) {
          position = parent.data.props.columns[colIndex].childrenIds.length;
        }
      }
      // Check if dropped on an existing block (insert before it at root level)
      else if (overId.startsWith("block-")) {
        const targetBlockId = overId;
        const index = document.childrenIds.indexOf(targetBlockId);
        if (index !== -1) {
          position = index;
          parentId = undefined;
        }
      }
      // Check if dropped on the canvas root drop zone
      else if (overId === "canvas-root") {
        position = document.childrenIds.length;
        parentId = undefined;
      }

      // Add block with parent and column info
      addBlock(blockType, position, parentId, columnIndex);
      return;
    }

    // Case 2: Reordering existing blocks
    if (active.id.toString().startsWith("block-")) {
      const activeId = active.id.toString();
      const overId = over.id.toString();
      const overData = over.data.current;

      // Moving into a container
      if (overData?.type === "container-drop-zone") {
        const containerId = overData.containerId;
        if (!containerId) return;
        const container = document[containerId] as any;
        if (container?.data?.props?.childrenIds) {
          const position = container.data.props.childrenIds.length;
          moveBlock(activeId, position, containerId);
        }
        return;
      }

      // Moving into a column
      if (overData?.type === "column-drop-zone") {
        const columnBlockId = overData.columnBlockId;
        const columnIndex = overData.columnIndex;
        if (!columnBlockId) return;
        const columnBlock = document[columnBlockId] as any;
        if (columnBlock?.data?.props?.columns?.[columnIndex]?.childrenIds) {
          const position = columnBlock.data.props.columns[columnIndex].childrenIds.length;
          moveBlock(activeId, position, columnBlockId, columnIndex);
        }
        return;
      }

      // Moving within same level
      if (overId.startsWith("block-")) {
        const activeIndex = document.childrenIds.indexOf(activeId);
        const overIndex = document.childrenIds.indexOf(overId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          moveBlock(activeId, overIndex);
        }
      }
    }
  };


  const rootChildrenIds = document.childrenIds || [];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-auto p-8">
        <div
          className="max-w-[600px] mx-auto bg-white shadow-lg min-h-[600px] relative"
          style={{
            backgroundColor: document.canvasColor,
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <DropZone id="canvas-root" className="p-4 pl-2">
              {rootChildrenIds.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <p className="text-lg mb-2">Drag blocks here to start building</p>
                  <p className="text-sm">Or click blocks in the sidebar to add them</p>
                </div>
              ) : (
                <SortableContext
                  items={rootChildrenIds}
                  strategy={verticalListSortingStrategy}
                >
                  {rootChildrenIds.map((blockId, index) => (
                    <SortableBlockWrapper key={blockId} blockId={blockId}>
                      <BlockRenderer
                        blockId={blockId}
                        onSelect={() => selectBlock(blockId)}
                        isSelected={state.selectedBlockId === blockId}
                      />
                      {/* Drop indicator */}
                      {index < rootChildrenIds.length - 1 && (
                        <div className="h-2 flex items-center justify-center">
                          <div className="h-0.5 w-full bg-transparent hover:bg-blue-300 transition-colors" />
                        </div>
                      )}
                    </SortableBlockWrapper>
                  ))}
                </SortableContext>
              )}
            </DropZone>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

