/**
 * Properties Panel Component
 * Shows and edits properties of selected block
 */

"use client";

import React from "react";
import { useEmailBuilder } from "./EmailBuilderContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmailBlock, TextBlock, HeadingBlock, ImageBlock, ButtonBlock, DividerBlock, SpacerBlock, SocialLinksBlock, ListBlock, HeroBlock, QuoteBlock } from "@/lib/email-builder/types";
import { Textarea } from "@/components/ui/textarea";

function renderBlockProps(
  block: EmailBlock,
  blockId: string,
  updateBlock: (blockId: string, updates: Partial<EmailBlock>) => void
): React.ReactNode {

  const handlePropsUpdate = (propsUpdates: Partial<typeof block.data.props>) => {
    updateBlock(blockId, {
      data: {
        ...block.data,
        props: {
          ...block.data.props,
          ...propsUpdates,
        },
      },
    } as Partial<EmailBlock>);
  };

  switch (block.type) {
    case "Text": {
      const textBlock = block as TextBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Text Content</Label>
            <Textarea
              value={textBlock.data.props.text || ""}
              onChange={(e) => handlePropsUpdate({ text: e.target.value })}
              rows={4}
              placeholder="Enter text content (HTML allowed)"
            />
          </div>
        </div>
      );
    }

    case "Heading": {
      const headingBlock = block as HeadingBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Heading Text</Label>
            <Input
              value={headingBlock.data.props.text || ""}
              onChange={(e) => handlePropsUpdate({ text: e.target.value })}
              placeholder="Enter heading text"
            />
          </div>
          <div>
            <Label>Level</Label>
            <Select
              value={headingBlock.data.props.level || "2"}
              onValueChange={(value) => handlePropsUpdate({ level: value as "1" | "2" | "3" | "4" | "5" | "6" })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    case "Image": {
      const imageBlock = block as ImageBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Image URL</Label>
            <Input
              value={imageBlock.data.props.url || ""}
              onChange={(e) => handlePropsUpdate({ url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input
              value={imageBlock.data.props.alt || ""}
              onChange={(e) => handlePropsUpdate({ alt: e.target.value })}
              placeholder="Image description"
            />
          </div>
          <div>
            <Label>Link URL (optional)</Label>
            <Input
              value={imageBlock.data.props.linkHref || ""}
              onChange={(e) => handlePropsUpdate({ linkHref: e.target.value || null })}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Width (px)</Label>
              <Input
                type="number"
                value={imageBlock.data.props.width || ""}
                onChange={(e) => handlePropsUpdate({ width: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Auto"
              />
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input
                type="number"
                value={imageBlock.data.props.height || ""}
                onChange={(e) => handlePropsUpdate({ height: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Auto"
              />
            </div>
          </div>
          <div>
            <Label>Alignment</Label>
            <Select
              value={imageBlock.data.props.contentAlignment || "center"}
              onValueChange={(value: "left" | "center" | "right") => handlePropsUpdate({ contentAlignment: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    case "Button": {
      const buttonBlock = block as ButtonBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Button Text</Label>
            <Input
              value={buttonBlock.data.props.text || ""}
              onChange={(e) => handlePropsUpdate({ text: e.target.value })}
              placeholder="Click me"
            />
          </div>
          <div>
            <Label>Link URL</Label>
            <Input
              value={buttonBlock.data.props.url || ""}
              onChange={(e) => handlePropsUpdate({ url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={buttonBlock.data.props.buttonColor || "#2563EB"}
                  onChange={(e) => handlePropsUpdate({ buttonColor: e.target.value })}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={buttonBlock.data.props.buttonColor || ""}
                  onChange={(e) => handlePropsUpdate({ buttonColor: e.target.value })}
                  placeholder="#2563EB"
                  className="flex-1 h-8"
                />
              </div>
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={buttonBlock.data.props.buttonTextColor || "#FFFFFF"}
                  onChange={(e) => handlePropsUpdate({ buttonTextColor: e.target.value })}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={buttonBlock.data.props.buttonTextColor || ""}
                  onChange={(e) => handlePropsUpdate({ buttonTextColor: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>
              <input
                type="checkbox"
                checked={buttonBlock.data.props.fullWidth || false}
                onChange={(e) => handlePropsUpdate({ fullWidth: e.target.checked })}
                className="mr-2"
              />
              Full Width
            </Label>
          </div>
        </div>
      );
    }

    case "Divider": {
      const dividerBlock = block as DividerBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Line Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={dividerBlock.data.props.lineColor || "#E5E7EB"}
                onChange={(e) => handlePropsUpdate({ lineColor: e.target.value })}
                className="h-8 w-16"
              />
              <Input
                type="text"
                value={dividerBlock.data.props.lineColor || ""}
                onChange={(e) => handlePropsUpdate({ lineColor: e.target.value })}
                placeholder="#E5E7EB"
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label>Line Height (thickness in px)</Label>
            <Input
              type="number"
              value={dividerBlock.data.props.lineHeight || 1}
              onChange={(e) => handlePropsUpdate({ lineHeight: parseInt(e.target.value) || 1 })}
              min="1"
              max="10"
            />
          </div>
        </div>
      );
    }

    case "Spacer": {
      const spacerBlock = block as SpacerBlock;
      return (
        <div>
          <Label>Height (px)</Label>
          <Input
            type="number"
            value={spacerBlock.data.props.height || 20}
            onChange={(e) => handlePropsUpdate({ height: parseInt(e.target.value) || 20 })}
            min="0"
          />
        </div>
      );
    }

    case "SocialLinks": {
      const socialBlock = block as SocialLinksBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Icon Size (px)</Label>
            <Input
              type="number"
              value={socialBlock.data.props.iconSize || 32}
              onChange={(e) => handlePropsUpdate({ iconSize: parseInt(e.target.value) || 32 })}
              min="16"
              max="64"
            />
          </div>
          <div>
            <Label>Spacing (px)</Label>
            <Input
              type="number"
              value={socialBlock.data.props.spacing || 12}
              onChange={(e) => handlePropsUpdate({ spacing: parseInt(e.target.value) || 12 })}
              min="0"
              max="40"
            />
          </div>
          <div>
            <Label>Alignment</Label>
            <Select
              value={socialBlock.data.props.alignment || "center"}
              onValueChange={(value: "left" | "center" | "right") => handlePropsUpdate({ alignment: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Icon Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={socialBlock.data.props.iconColor || "#6B7280"}
                onChange={(e) => handlePropsUpdate({ iconColor: e.target.value })}
                className="h-8 w-16"
              />
              <Input
                type="text"
                value={socialBlock.data.props.iconColor || ""}
                onChange={(e) => handlePropsUpdate({ iconColor: e.target.value || null })}
                placeholder="#6B7280"
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Edit social links by updating the JSON or adding them programmatically
          </div>
        </div>
      );
    }

    case "List": {
      const listBlock = block as ListBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>List Type</Label>
            <Select
              value={listBlock.data.props.listType || "unordered"}
              onValueChange={(value: "ordered" | "unordered") => handlePropsUpdate({ listType: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unordered">Unordered</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bullet Style</Label>
            <Select
              value={listBlock.data.props.bulletStyle || "disc"}
              onValueChange={(value: "disc" | "circle" | "square" | "decimal") => handlePropsUpdate({ bulletStyle: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disc">Disc</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="decimal">Decimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs text-gray-500">
            Edit list items by double-clicking the list in the canvas
          </div>
        </div>
      );
    }

    case "Hero": {
      const heroBlock = block as HeroBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Background Image URL</Label>
            <Input
              value={heroBlock.data.props.backgroundImage || ""}
              onChange={(e) => handlePropsUpdate({ backgroundImage: e.target.value || null })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label>Heading</Label>
            <Input
              value={heroBlock.data.props.heading || ""}
              onChange={(e) => handlePropsUpdate({ heading: e.target.value })}
              placeholder="Welcome"
            />
          </div>
          <div>
            <Label>Subheading</Label>
            <Textarea
              value={heroBlock.data.props.subheading || ""}
              onChange={(e) => handlePropsUpdate({ subheading: e.target.value })}
              placeholder="Subheading text"
              rows={2}
            />
          </div>
          <div>
            <Label>Button Text</Label>
            <Input
              value={heroBlock.data.props.buttonText || ""}
              onChange={(e) => handlePropsUpdate({ buttonText: e.target.value || null })}
              placeholder="Get Started"
            />
          </div>
          <div>
            <Label>Button URL</Label>
            <Input
              value={heroBlock.data.props.buttonUrl || ""}
              onChange={(e) => handlePropsUpdate({ buttonUrl: e.target.value || null })}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={heroBlock.data.props.buttonColor || "#2563EB"}
                  onChange={(e) => handlePropsUpdate({ buttonColor: e.target.value })}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={heroBlock.data.props.buttonColor || ""}
                  onChange={(e) => handlePropsUpdate({ buttonColor: e.target.value })}
                  className="flex-1 h-8"
                />
              </div>
            </div>
            <div>
              <Label>Button Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={heroBlock.data.props.buttonTextColor || "#FFFFFF"}
                  onChange={(e) => handlePropsUpdate({ buttonTextColor: e.target.value })}
                  className="h-8 w-16"
                />
                <Input
                  type="text"
                  value={heroBlock.data.props.buttonTextColor || ""}
                  onChange={(e) => handlePropsUpdate({ buttonTextColor: e.target.value })}
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={heroBlock.data.props.textColor || "#242424"}
                onChange={(e) => handlePropsUpdate({ textColor: e.target.value || null })}
                className="h-8 w-16"
              />
              <Input
                type="text"
                value={heroBlock.data.props.textColor || ""}
                onChange={(e) => handlePropsUpdate({ textColor: e.target.value || null })}
                placeholder="#242424"
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label>Overlay Opacity</Label>
            <Input
              type="number"
              value={heroBlock.data.props.overlayOpacity || 0.3}
              onChange={(e) => handlePropsUpdate({ overlayOpacity: parseFloat(e.target.value) || 0.3 })}
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>
      );
    }

    case "Quote": {
      const quoteBlock = block as QuoteBlock;
      return (
        <div className="space-y-4">
          <div>
            <Label>Quote</Label>
            <Textarea
              value={quoteBlock.data.props.quote || ""}
              onChange={(e) => handlePropsUpdate({ quote: e.target.value })}
              placeholder="This is a great quote!"
              rows={3}
            />
          </div>
          <div>
            <Label>Author</Label>
            <Input
              value={quoteBlock.data.props.author || ""}
              onChange={(e) => handlePropsUpdate({ author: e.target.value || null })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label>Author Role</Label>
            <Input
              value={quoteBlock.data.props.authorRole || ""}
              onChange={(e) => handlePropsUpdate({ authorRole: e.target.value || null })}
              placeholder="CEO, Company Name"
            />
          </div>
          <div>
            <Label>Quote Style</Label>
            <Select
              value={quoteBlock.data.props.quoteStyle || "border-left"}
              onValueChange={(value: "border-left" | "centered" | "minimal") => handlePropsUpdate({ quoteStyle: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="border-left">Border Left</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quote Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={quoteBlock.data.props.quoteColor || "#242424"}
                onChange={(e) => handlePropsUpdate({ quoteColor: e.target.value || null })}
                className="h-8 w-16"
              />
              <Input
                type="text"
                value={quoteBlock.data.props.quoteColor || ""}
                onChange={(e) => handlePropsUpdate({ quoteColor: e.target.value || null })}
                placeholder="#242424"
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label>Author Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={quoteBlock.data.props.authorColor || "#6B7280"}
                onChange={(e) => handlePropsUpdate({ authorColor: e.target.value || null })}
                className="h-8 w-16"
              />
              <Input
                type="text"
                value={quoteBlock.data.props.authorColor || ""}
                onChange={(e) => handlePropsUpdate({ authorColor: e.target.value || null })}
                placeholder="#6B7280"
                className="flex-1 h-8"
              />
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="text-sm text-gray-500">
          Properties editing for this block type coming soon
        </div>
      );
  }
}

export function PropertiesPanel() {
  const { state, updateBlock, getBlock } = useEmailBuilder();
  const selectedBlock = state.selectedBlockId
    ? getBlock(state.selectedBlockId)
    : null;

  if (!selectedBlock) {
    return (
      <div className="w-80 border-l bg-white p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Properties</h3>
        <div className="text-center text-gray-400 py-8">
          <p>Select a block to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleStyleUpdate = (styleUpdates: Partial<typeof selectedBlock.data.style>) => {
    updateBlock(state.selectedBlockId!, {
      data: {
        ...selectedBlock.data,
        style: {
          ...selectedBlock.data.style,
          ...styleUpdates,
        },
      },
    } as Partial<EmailBlock>);
  };

  const handlePropsUpdate = (propsUpdates: Partial<typeof selectedBlock.data.props>) => {
    updateBlock(state.selectedBlockId!, {
      data: {
        ...selectedBlock.data,
        props: {
          ...selectedBlock.data.props,
          ...propsUpdates,
        },
      },
    } as Partial<EmailBlock>);
  };

  return (
    <div className="w-80 border-l bg-white p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Properties</h3>
      
      {/* Block Type */}
      <div className="mb-4 pb-4 border-b">
        <Label className="text-sm text-gray-500">Block Type</Label>
        <p className="font-medium">{selectedBlock.type}</p>
      </div>

      {/* Style Section */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-sm">Style</h4>
        
        {/* Padding */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div>
            <Label className="text-xs">Top</Label>
            <Input
              type="number"
              value={selectedBlock.data.style.padding?.top || 0}
              onChange={(e) =>
                handleStyleUpdate({
                    padding: {
                      top: parseInt(e.target.value) || 0,
                      right: selectedBlock.data.style.padding?.right || 0,
                      bottom: selectedBlock.data.style.padding?.bottom || 0,
                      left: selectedBlock.data.style.padding?.left || 0,
                    },
                })
              }
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Right</Label>
            <Input
              type="number"
              value={selectedBlock.data.style.padding?.right || 0}
              onChange={(e) =>
                handleStyleUpdate({
                  padding: {
                    top: selectedBlock.data.style.padding?.top || 0,
                    right: parseInt(e.target.value) || 0,
                    bottom: selectedBlock.data.style.padding?.bottom || 0,
                    left: selectedBlock.data.style.padding?.left || 0,
                  },
                })
              }
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Bottom</Label>
            <Input
              type="number"
              value={selectedBlock.data.style.padding?.bottom || 0}
              onChange={(e) =>
                handleStyleUpdate({
                  padding: {
                    top: selectedBlock.data.style.padding?.top || 0,
                    right: selectedBlock.data.style.padding?.right || 0,
                    bottom: parseInt(e.target.value) || 0,
                    left: selectedBlock.data.style.padding?.left || 0,
                  },
                })
              }
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Left</Label>
            <Input
              type="number"
              value={selectedBlock.data.style.padding?.left || 0}
              onChange={(e) =>
                handleStyleUpdate({
                  padding: {
                    top: selectedBlock.data.style.padding?.top || 0,
                    right: selectedBlock.data.style.padding?.right || 0,
                    bottom: selectedBlock.data.style.padding?.bottom || 0,
                    left: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="h-8"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="mb-4">
          <Label>Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={selectedBlock.data.style.backgroundColor || "#ffffff"}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
              className="h-8 w-16"
            />
            <Input
              type="text"
              value={selectedBlock.data.style.backgroundColor || ""}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value || null })}
              placeholder="#ffffff"
              className="flex-1 h-8"
            />
          </div>
        </div>

        {/* Text Color */}
        <div className="mb-4">
          <Label>Text Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={selectedBlock.data.style.color || "#000000"}
              onChange={(e) => handleStyleUpdate({ color: e.target.value })}
              className="h-8 w-16"
            />
            <Input
              type="text"
              value={selectedBlock.data.style.color || ""}
              onChange={(e) => handleStyleUpdate({ color: e.target.value || null })}
              placeholder="#000000"
              className="flex-1 h-8"
            />
          </div>
        </div>

        {/* Font Size */}
        {selectedBlock.type !== "Spacer" && (
          <div className="mb-4">
            <Label>Font Size (px)</Label>
            <Input
              type="number"
              value={selectedBlock.data.style.fontSize || ""}
              onChange={(e) =>
                handleStyleUpdate({
                  fontSize: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Auto"
              className="h-8"
            />
          </div>
        )}

        {/* Font Weight */}
        {selectedBlock.type !== "Spacer" && (
          <div className="mb-4">
            <Label>Font Weight</Label>
            <Select
              value={selectedBlock.data.style.fontWeight}
              onValueChange={(value: "normal" | "bold") =>
                handleStyleUpdate({ fontWeight: value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Text Align */}
        {["Text", "Heading", "Button", "Image"].includes(selectedBlock.type) && (
          <div className="mb-4">
            <Label>Text Align</Label>
            <Select
              value={selectedBlock.data.style.textAlign}
              onValueChange={(value: "left" | "center" | "right") =>
                handleStyleUpdate({ textAlign: value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Props Section - Block-specific */}
      <div>
        <h4 className="font-semibold mb-3 text-sm">Properties</h4>
        {renderBlockProps(selectedBlock, state.selectedBlockId!, updateBlock)}
      </div>
    </div>
  );
}

