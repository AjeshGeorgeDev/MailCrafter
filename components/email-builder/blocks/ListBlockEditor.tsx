/**
 * List Block Editor Component
 */

"use client";

import React, { useState } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { ListBlock } from "@/lib/email-builder/types";

interface ListBlockEditorProps {
  block: ListBlock;
  blockId: string;
}

export function ListBlockEditor({ block, blockId }: ListBlockEditorProps) {
  const { updateBlock } = useEmailBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(block.data.props.items);

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    color: block.data.style.color || undefined,
    fontSize: block.data.style.fontSize ? `${block.data.style.fontSize}px` : undefined,
    fontWeight: block.data.style.fontWeight,
    textAlign: block.data.style.textAlign,
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          items: items.filter((item) => item.trim() !== ""),
        },
      },
    });
  };

  const { listType, bulletStyle } = block.data.props;

  if (isEditing) {
    return (
      <div style={style}>
        <textarea
          value={items.join("\n")}
          onChange={(e) => setItems(e.target.value.split("\n"))}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleBlur();
            }
            if (e.key === "Escape") {
              setItems(block.data.props.items);
              setIsEditing(false);
            }
          }}
          className="w-full border-none outline-none resize-none"
          autoFocus
          rows={Math.max(3, items.length)}
          placeholder="Enter list items, one per line"
        />
      </div>
    );
  }

  const listStyle =
    listType === "unordered"
      ? {
          listStyleType:
            bulletStyle === "disc"
              ? "disc"
              : bulletStyle === "circle"
              ? "circle"
              : "square",
        }
      : {
          listStyleType: bulletStyle === "decimal" ? "decimal" : "decimal",
        };

  const Tag = listType === "ordered" ? "ol" : "ul";

  return (
    <div
      style={style}
      onDoubleClick={() => setIsEditing(true)}
      className="cursor-text"
    >
      <Tag style={{ margin: 0, paddingLeft: "24px", ...listStyle }}>
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={index} style={{ marginBottom: "4px" }}>
              {item || "Empty item"}
            </li>
          ))
        ) : (
          <li>Double-click to edit</li>
        )}
      </Tag>
    </div>
  );
}

