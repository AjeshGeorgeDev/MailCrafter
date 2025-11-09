/**
 * Hero Block Editor Component
 */

"use client";

import React, { useState } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { HeroBlock } from "@/lib/email-builder/types";

interface HeroBlockEditorProps {
  block: HeroBlock;
  blockId: string;
  templateId?: string;
}

export function HeroBlockEditor({ block, blockId, templateId }: HeroBlockEditorProps) {
  const { updateBlock } = useEmailBuilder();
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [isEditingSubheading, setIsEditingSubheading] = useState(false);
  const [heading, setHeading] = useState(block.data.props.heading);
  const [subheading, setSubheading] = useState(block.data.props.subheading);

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    textAlign: block.data.style.textAlign,
    position: "relative" as const,
    minHeight: "200px",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    backgroundImage: block.data.props.backgroundImage
      ? `url(${block.data.props.backgroundImage})`
      : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const textColor = block.data.props.textColor || block.data.style.color || "#242424";

  const handleHeadingBlur = () => {
    setIsEditingHeading(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          heading,
        },
      },
    });
  };

  const handleSubheadingBlur = () => {
    setIsEditingSubheading(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          subheading,
        },
      },
    });
  };

  const overlayStyle = block.data.props.backgroundImage
    ? {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `rgba(0, 0, 0, ${block.data.props.overlayOpacity})`,
        zIndex: 1,
      }
    : {};

  const contentStyle = {
    position: "relative" as const,
    zIndex: 2,
    color: textColor,
    maxWidth: "600px",
    width: "100%",
    padding: "0 20px",
  };

  return (
    <div style={style}>
      {block.data.props.backgroundImage && <div style={overlayStyle} />}
      <div style={contentStyle}>
        {isEditingHeading ? (
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            onBlur={handleHeadingBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleHeadingBlur();
              }
              if (e.key === "Escape") {
                setHeading(block.data.props.heading);
                setIsEditingHeading(false);
              }
            }}
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-center mb-4"
            style={{ color: textColor }}
            autoFocus
          />
        ) : (
          <h1
            onDoubleClick={() => setIsEditingHeading(true)}
            className="text-3xl font-bold mb-4 cursor-text"
            style={{ color: textColor }}
          >
            {heading || "Double-click to edit heading"}
          </h1>
        )}

        {isEditingSubheading ? (
          <textarea
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            onBlur={handleSubheadingBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                handleSubheadingBlur();
              }
              if (e.key === "Escape") {
                setSubheading(block.data.props.subheading);
                setIsEditingSubheading(false);
              }
            }}
            className="w-full text-lg bg-transparent border-none outline-none resize-none text-center mb-6"
            style={{ color: textColor }}
            rows={2}
            autoFocus
          />
        ) : (
          <p
            onDoubleClick={() => setIsEditingSubheading(true)}
            className="text-lg mb-6 cursor-text"
            style={{ color: textColor }}
          >
            {subheading || "Double-click to edit subheading"}
          </p>
        )}

        {block.data.props.buttonText && (
          <div className="flex justify-center">
            <a
              href={block.data.props.buttonUrl || "#"}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: block.data.props.buttonColor,
                color: block.data.props.buttonTextColor,
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold",
              }}
            >
              {block.data.props.buttonText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

