/**
 * Quote Block Editor Component
 */

"use client";

import React, { useState } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { QuoteBlock } from "@/lib/email-builder/types";

interface QuoteBlockEditorProps {
  block: QuoteBlock;
  blockId: string;
}

export function QuoteBlockEditor({ block, blockId }: QuoteBlockEditorProps) {
  const { updateBlock } = useEmailBuilder();
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [quote, setQuote] = useState(block.data.props.quote);
  const [author, setAuthor] = useState(block.data.props.author || "");

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    color: block.data.style.color || undefined,
    fontSize: block.data.style.fontSize ? `${block.data.style.fontSize}px` : undefined,
    fontWeight: block.data.style.fontWeight,
    textAlign: block.data.style.textAlign,
  };

  const { quoteStyle, quoteColor, authorColor, authorRole } = block.data.props;

  const handleQuoteBlur = () => {
    setIsEditingQuote(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          quote,
        },
      },
    });
  };

  const handleAuthorBlur = () => {
    setIsEditingAuthor(false);
    updateBlock(blockId, {
      ...block,
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          author,
        },
      },
    });
  };

  const quoteTextStyle = {
    color: quoteColor || block.data.style.color || "#242424",
    fontStyle: "italic" as const,
    fontSize: quoteStyle === "centered" ? "1.25rem" : "1.1rem",
    marginBottom: author ? "12px" : "0",
  };

  const authorTextStyle = {
    color: authorColor || block.data.style.color || "#6B7280",
    fontSize: "0.9rem",
    fontWeight: "normal" as const,
  };

  const borderLeftStyle =
    quoteStyle === "border-left"
      ? {
          borderLeft: "4px solid",
          borderColor: quoteColor || "#2563EB",
          paddingLeft: "20px",
        }
      : {};

  const centeredStyle =
    quoteStyle === "centered"
      ? {
          textAlign: "center" as const,
        }
      : {};

  return (
    <div style={{ ...style, ...borderLeftStyle, ...centeredStyle }}>
      {isEditingQuote ? (
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          onBlur={handleQuoteBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleQuoteBlur();
            }
            if (e.key === "Escape") {
              setQuote(block.data.props.quote);
              setIsEditingQuote(false);
            }
          }}
          className="w-full border-none outline-none resize-none bg-transparent"
          style={quoteTextStyle}
          rows={3}
          autoFocus
        />
      ) : (
        <p
          onDoubleClick={() => setIsEditingQuote(true)}
          style={quoteTextStyle}
          className="cursor-text"
        >
          {quote || "Double-click to edit quote"}
        </p>
      )}

      {author && (
        <div style={{ marginTop: "12px" }}>
          {isEditingAuthor ? (
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onBlur={handleAuthorBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAuthorBlur();
                }
                if (e.key === "Escape") {
                  setAuthor(block.data.props.author || "");
                  setIsEditingAuthor(false);
                }
              }}
              className="w-full border-none outline-none bg-transparent"
              style={authorTextStyle}
              autoFocus
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditingAuthor(true)}
              style={authorTextStyle}
              className="cursor-text"
            >
              <strong>{author}</strong>
              {authorRole && <span> — {authorRole}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

