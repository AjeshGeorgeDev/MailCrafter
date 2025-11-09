/**
 * Image Block Editor Component
 * Enhanced with upload functionality
 */

"use client";

import React, { useRef, useState } from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { ImageBlock } from "@/lib/email-builder/types";
import { ImageIcon, Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "../hooks/useImageUpload";

interface ImageBlockEditorProps {
  block: ImageBlock;
  blockId: string;
  templateId?: string;
}

export function ImageBlockEditor({
  block,
  blockId,
  templateId,
}: ImageBlockEditorProps) {
  const { updateBlock } = useEmailBuilder();
  const { uploadImage, isUploading } = useImageUpload({ templateId });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [urlInput, setUrlInput] = useState(block.data.props.url || "");
  const [showUrlInput, setShowUrlInput] = useState(!block.data.props.url);

  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    textAlign: block.data.style.textAlign,
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (templateId) {
      // Upload to server
      const url = await uploadImage(file);
      if (url) {
        updateBlock(blockId, {
          ...block,
          data: {
            ...block.data,
            props: {
              ...block.data.props,
              url,
            },
          },
        });
      }
    } else {
      // Use local file URL (for preview only)
      const url = URL.createObjectURL(file);
      updateBlock(blockId, {
        ...block,
        data: {
          ...block.data,
          props: {
            ...block.data.props,
            url,
          },
        },
      });
    }

    // Reset input
    event.target.value = "";
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      updateBlock(blockId, {
        ...block,
        data: {
          ...block.data,
          props: {
            ...block.data.props,
            url: urlInput.trim(),
          },
        },
      });
      setShowUrlInput(false);
      setImageError(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    // Update block immediately as user types (for real-time preview)
    if (e.target.value.trim()) {
      updateBlock(blockId, {
        ...block,
        data: {
          ...block.data,
          props: {
            ...block.data.props,
            url: e.target.value.trim(),
          },
        },
      });
      setImageError(false);
    }
  };

  // Sync urlInput with block data when it changes externally
  React.useEffect(() => {
    setUrlInput(block.data.props.url || "");
    setShowUrlInput(!block.data.props.url);
  }, [block.data.props.url]);

  return (
    <div style={style}>
      {showUrlInput ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-8 space-y-4">
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <div className="w-full max-w-md space-y-2">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={handleUrlChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUrlSubmit();
                  }
                }}
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                className="flex-1"
              />
              <Button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Use URL
              </Button>
            </div>
            <div className="text-center text-sm text-gray-500">or</div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </div>
        </div>
      ) : block.data.props.url ? (
        <div className="relative group">
          {imageError ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-red-300 bg-red-50 p-8 min-h-[200px]">
              <ImageIcon className="h-12 w-12 text-red-400 mb-2" />
              <p className="text-sm text-red-600 mb-2">Failed to load image</p>
              <p className="text-xs text-gray-500 mb-4 text-center max-w-xs truncate">{block.data.props.url}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowUrlInput(true);
                    setImageError(false);
                  }}
                >
                  Change URL
                </Button>
                {templateId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <img
                src={block.data.props.url}
                alt={block.data.props.alt || ""}
                style={{
                  width: block.data.props.width ? `${block.data.props.width}px` : "100%",
                  height: block.data.props.height ? `${block.data.props.height}px` : "auto",
                  maxWidth: "100%",
                  display: "block",
                }}
                onError={() => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowUrlInput(true);
                    setUrlInput(block.data.props.url || "");
                  }}
                >
                  <LinkIcon className="h-3 w-3 mr-1" />
                  Change URL
                </Button>
                {templateId && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {isUploading ? "Uploading..." : "Replace"}
                  </Button>
                )}
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-8">
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4">No image set</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      )}
    </div>
  );
}
