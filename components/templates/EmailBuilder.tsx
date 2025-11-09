"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { EmailDocument, EmailBlock, BlockType } from "@/lib/email/types";
import { renderToStaticMarkup } from "@/lib/email/renderer";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EmailBuilderProps {
  initialStructure?: EmailDocument;
  onSave?: (structure: EmailDocument) => void;
  autoSaveInterval?: number;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string | null) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<EmailBlock>) => void;
}

export function EmailBuilderWrapper({
  initialStructure,
  onSave,
  autoSaveInterval = 30000,
  selectedBlockId: externalSelectedBlockId,
  onSelectBlock,
  onUpdateBlock,
}: EmailBuilderProps) {
  const [document, setDocument] = useState<EmailDocument>(() => {
    // Ensure we always have a valid document structure
    if (!initialStructure || !initialStructure.root || !initialStructure.root.data) {
      return createEmptyDocument();
    }
    return initialStructure;
  });
  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string | null>(null);
  const selectedBlockId = externalSelectedBlockId !== undefined ? externalSelectedBlockId : internalSelectedBlockId;
  
  const handleSelectBlock = (id: string | null) => {
    if (onSelectBlock) {
      onSelectBlock(id);
    } else {
      setInternalSelectedBlockId(id);
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const addingBlockRef = useRef(false);

  // Auto-save functionality
  const saveStructure = useCallback(async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave(document);
      setLastSaved(new Date());
      toast.success("Template saved", { duration: 2000 });
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }, [document, onSave]);

  // Setup auto-save timer
  useEffect(() => {
    if (autoSaveInterval > 0 && onSave) {
      autoSaveTimerRef.current = setInterval(() => {
        saveStructure();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, onSave, saveStructure]);

  const addBlock = (type: BlockType, parentId: string = "root") => {
    // Prevent double-adds (React StrictMode in dev causes double renders)
    if (addingBlockRef.current) {
      return;
    }
    addingBlockRef.current = true;

    const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newBlock = createBlock(type, newBlockId);

    setDocument((prev) => {
      const updated = { ...prev };
      
      // Check if block already exists (prevent duplicates)
      if (updated[newBlockId]) {
        addingBlockRef.current = false;
        return prev;
      }
      
      updated[newBlockId] = newBlock;

      if (parentId === "root") {
        // Only add if not already in the array
        if (!updated.root.data.childrenIds.includes(newBlockId)) {
          updated.root.data.childrenIds.push(newBlockId);
        }
      } else {
        const parent = updated[parentId] as any;
        if (parent?.props?.childrenIds && !parent.props.childrenIds.includes(newBlockId)) {
          parent.props.childrenIds.push(newBlockId);
        }
      }

      addingBlockRef.current = false;
      return updated;
    });

    handleSelectBlock(newBlockId);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      addingBlockRef.current = false;
    }, 100);
  };

  const deleteBlock = (blockId: string) => {
    setDocument((prev) => {
      const updated = { ...prev };
      delete updated[blockId];

      // Remove from parent's childrenIds
      const rootChildren = updated.root.data.childrenIds;
      updated.root.data.childrenIds = rootChildren.filter((id) => id !== blockId);

      // Also check containers
      Object.keys(updated).forEach((key) => {
        const block = updated[key] as any;
        if (block?.props?.childrenIds) {
          block.props.childrenIds = block.props.childrenIds.filter(
            (id: string) => id !== blockId
          );
        }
      });

      return updated;
    });

    if (selectedBlockId === blockId) {
      handleSelectBlock(null);
    }
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    if (onUpdateBlock) {
      onUpdateBlock(blockId, updates);
    } else {
      setDocument((prev) => {
        const updated = { ...prev };
        updated[blockId] = { ...updated[blockId], ...updates } as EmailBlock;
        return updated;
      });
    }
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    setDocument((prev) => {
      const updated = { ...prev };
      const childrenIds = [...updated.root.data.childrenIds];
      const reordered = arrayMove(childrenIds, oldIndex, newIndex);
      updated.root.data.childrenIds = reordered;
      return updated;
    });
  };
  
  // Update document when external updates come in
  useEffect(() => {
    if (initialStructure) {
      setDocument(initialStructure);
    }
  }, [initialStructure]);

  const selectedBlock = selectedBlockId ? document[selectedBlockId] : null;

  return (
    <div className="flex h-full gap-4">
      {/* Block Palette */}
      <div className="w-64 border-r bg-white p-4">
        <h3 className="font-semibold mb-4">Blocks</h3>
        <div className="space-y-2">
          {(
            [
              { type: "Text", label: "Text" },
              { type: "Heading", label: "Heading" },
              { type: "Button", label: "Button" },
              { type: "Image", label: "Image" },
              { type: "Spacer", label: "Spacer" },
              { type: "Divider", label: "Divider" },
              { type: "Container", label: "Container" },
              { type: "Columns", label: "Columns" },
            ] as { type: BlockType; label: string }[]
          ).map(({ type, label }) => (
            <Button
              key={type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => addBlock(type)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Save Status */}
        <div className="border-b p-2 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Email Preview */}
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="max-w-2xl mx-auto bg-white shadow-lg">
            <DragDropEmailPreview
              document={document}
              selectedBlockId={selectedBlockId}
              onSelect={handleSelectBlock}
              onDelete={deleteBlock}
              onUpdate={updateBlock}
              onReorder={handleReorder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DragDropEmailPreview({
  document,
  selectedBlockId,
  onSelect,
  onDelete,
  onUpdate,
  onReorder,
}: {
  document: EmailDocument;
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EmailBlock>) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}) {
  // Safety check - ensure document has root
  if (!document || !document.root || !document.root.data) {
    console.error("Invalid document structure:", document);
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Invalid template structure. Please reload the template.</p>
      </div>
    );
  }

  // Configure sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const root = document.root;
  const childrenIds = root.data.childrenIds || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Get current childrenIds from the document (not from closure)
      const currentChildrenIds = document.root.data.childrenIds || [];
      const oldIndex = currentChildrenIds.indexOf(active.id as string);
      const newIndex = currentChildrenIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4">
        {childrenIds.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No blocks yet. Add blocks from the sidebar.</p>
          </div>
        ) : (
          <SortableContext items={childrenIds} strategy={verticalListSortingStrategy}>
            {childrenIds.map((id) => (
              <SortableBlockRenderer
                key={id}
                document={document}
                blockId={id}
                selectedBlockId={selectedBlockId}
                onSelect={onSelect}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </DndContext>
  );
}

function EmailPreview({
  document,
  selectedBlockId,
  onSelect,
  onDelete,
  onUpdate,
}: {
  document: EmailDocument;
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EmailBlock>) => void;
}) {
  // Safety check - ensure document has root
  if (!document || !document.root || !document.root.data) {
    console.error("Invalid document structure:", document);
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Invalid template structure. Please reload the template.</p>
      </div>
    );
  }

  const root = document.root;
  const childrenIds = root.data.childrenIds || [];

  return (
    <div className="p-4">
      {childrenIds.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No blocks yet. Add blocks from the sidebar.</p>
        </div>
      ) : (
        childrenIds.map((id) => (
          <BlockRenderer
            key={id}
            document={document}
            blockId={id}
            selectedBlockId={selectedBlockId}
            onSelect={onSelect}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))
      )}
    </div>
  );
}

function SortableBlockRenderer({
  document,
  blockId,
  selectedBlockId,
  onSelect,
  onDelete,
  onUpdate,
}: {
  document: EmailDocument;
  blockId: string;
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EmailBlock>) => void;
}) {
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
    position: 'relative' as const,
  };

  // Merge drag handle props - only attach listeners to the drag handle, not the whole block
  const dragHandleProps = {
    ...attributes,
    ...listeners,
    // Prevent click events from bubbling when dragging
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BlockRenderer
        document={document}
        blockId={blockId}
        selectedBlockId={selectedBlockId}
        onSelect={onSelect}
        onDelete={onDelete}
        onUpdate={onUpdate}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
      />
    </div>
  );
}

function BlockRenderer({
  document,
  blockId,
  selectedBlockId,
  onSelect,
  onDelete,
  onUpdate,
  dragHandleProps,
  isDragging,
}: {
  document: EmailDocument;
  blockId: string;
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<EmailBlock>) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
}) {
  const block = document[blockId] as EmailBlock | undefined;
  if (!block) {
    console.warn(`Block ${blockId} not found in document`);
    return null;
  }

  const isSelected = selectedBlockId === blockId;

  const renderBlockContent = () => {
    switch (block.type) {
      case "Text":
        return (
          <p className="mb-2">
            {(block as any).props?.text || "Text content"}
          </p>
        );
      case "Heading":
        const level = (block as any).props?.level || 1;
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        return (
          <HeadingTag className="mb-2 font-bold">
            {(block as any).props?.text || "Heading"}
          </HeadingTag>
        );
      case "Button":
        return (
          <a
            href={(block as any).props?.link || "#"}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded no-underline"
          >
            {(block as any).props?.text || "Button"}
          </a>
        );
      case "Image":
        return (
          <img
            src={(block as any).props?.src || "https://via.placeholder.com/300x200"}
            alt={(block as any).props?.alt || ""}
            className="max-w-full h-auto"
          />
        );
      case "Spacer":
        return <div style={{ height: `${(block as any).props?.height || 20}px` }} />;
      case "Divider":
        return <hr className="my-4" />;
      case "Container":
        const childrenIds = (block as any).props?.childrenIds || [];
        return (
          <div className="border-2 border-dashed p-4">
            {childrenIds.map((id: string) => (
              <BlockRenderer
                key={id}
                document={document}
                blockId={id}
                selectedBlockId={selectedBlockId}
                onSelect={onSelect}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        );
      default:
        return <div>{block.type}</div>;
    }
  };

  return (
    <div
      className={cn(
        "relative group border-2 rounded p-2 my-2",
        isSelected ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-gray-300",
        isDragging && "shadow-lg"
      )}
      onClick={(e) => {
        // Don't select if we're dragging
        if (!isDragging) {
          e.stopPropagation();
          onSelect(isSelected ? null : blockId);
        }
      }}
    >
      {isSelected && !isDragging && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(blockId);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Drag Handle - Only show if dragHandleProps provided */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 z-10 p-1 bg-white rounded shadow-sm hover:bg-gray-50"
          onMouseDown={(e) => {
            // Stop event propagation to prevent block selection when starting drag
            e.stopPropagation();
          }}
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}
      
      <div className={cn("flex items-center gap-2 mb-1", dragHandleProps && "ml-8")}>
        <span className="text-xs text-gray-500 font-medium">{block.type}</span>
      </div>
      {renderBlockContent()}
    </div>
  );
}

function createEmptyDocument(): EmailDocument {
  return {
    root: {
      type: "EmailLayout",
      data: {
        backdropColor: "#F8F8F8",
        canvasColor: "#FFFFFF",
        textColor: "#242424",
        fontFamily: "MODERN_SANS",
        childrenIds: [],
      },
    },
  };
}

function createBlock(type: BlockType, id: string): EmailBlock {
  const baseBlock = {
    type,
    id,
  };

  switch (type) {
    case "Text":
      return {
        ...baseBlock,
        props: { text: "Text content" },
      } as any;
    case "Heading":
      return {
        ...baseBlock,
        props: { text: "Heading", level: 2 },
      } as any;
    case "Button":
      return {
        ...baseBlock,
        props: { text: "Click me", link: "#" },
      } as any;
    case "Image":
      return {
        ...baseBlock,
        props: { src: "https://via.placeholder.com/300x200", alt: "Image" },
      } as any;
    case "Spacer":
      return {
        ...baseBlock,
        props: { height: 20 },
      } as any;
    case "Divider":
      return {
        ...baseBlock,
        props: { color: "#e0e0e0", height: 1 },
      } as any;
    case "Container":
      return {
        ...baseBlock,
        props: { childrenIds: [] },
      } as any;
    case "Columns":
      return {
        ...baseBlock,
        props: { columns: 2, childrenIds: [[], []] },
      } as any;
    default:
      return baseBlock as EmailBlock;
  }
}
