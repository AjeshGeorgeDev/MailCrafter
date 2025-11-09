"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, Link as LinkIcon, Palette } from "lucide-react";
import { EmailBlock } from "@/lib/email/types";

interface PropertyPanelProps {
  selectedBlock?: EmailBlock | null;
  onPropertyChange?: (property: string, value: any) => void;
}

export function PropertyPanel({ selectedBlock, onPropertyChange }: PropertyPanelProps) {
  if (!selectedBlock) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>Select a block to edit its properties</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click on any block in the editor to view and edit its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  const block = selectedBlock as any;
  const props = block.props || {};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual image upload to server
      const url = URL.createObjectURL(file);
      onPropertyChange?.("props.src", url);
    }
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
        <CardDescription>{block.type} Properties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Content */}
        {(block.type === "Text" || block.type === "Heading") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">Text Content</Label>
              <Input
                id="text"
                value={props.text || ""}
                onChange={(e) => onPropertyChange?.("props.text", e.target.value)}
                placeholder="Enter text..."
              />
            </div>
            {block.type === "Heading" && (
              <div className="space-y-2">
                <Label htmlFor="level">Heading Level</Label>
                <select
                  id="level"
                  value={props.level || 1}
                  onChange={(e) => onPropertyChange?.("props.level", parseInt(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                  <option value={5}>H5</option>
                  <option value={6}>H6</option>
                </select>
              </div>
            )}
            <Separator />
          </>
        )}

        {/* Button Properties */}
        {block.type === "Button" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={props.text || ""}
                onChange={(e) => onPropertyChange?.("props.text", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-link">
                <LinkIcon className="inline h-4 w-4 mr-1" />
                Link URL
              </Label>
              <Input
                id="button-link"
                type="url"
                value={props.link || ""}
                onChange={(e) => onPropertyChange?.("props.link", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <Separator />
          </>
        )}

        {/* Image Upload */}
        {block.type === "Image" && (
          <>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="Image URL"
                  value={props.src || ""}
                  onChange={(e) => onPropertyChange?.("props.src", e.target.value)}
                />
                <Button variant="outline" size="icon" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
              </div>
              {props.src && (
                <img
                  src={props.src}
                  alt={props.alt || "Preview"}
                  className="w-full h-32 object-cover rounded border"
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={props.alt || ""}
                  onChange={(e) => onPropertyChange?.("props.alt", e.target.value)}
                  placeholder="Alternative text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-link">Link URL (optional)</Label>
                <Input
                  id="image-link"
                  type="url"
                  value={props.link || ""}
                  onChange={(e) => onPropertyChange?.("props.link", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Spacer Height */}
        {block.type === "Spacer" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="spacer-height">Height (px)</Label>
              <Input
                id="spacer-height"
                type="number"
                value={props.height || 20}
                onChange={(e) => onPropertyChange?.("props.height", parseInt(e.target.value) || 20)}
                min={1}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Divider Properties */}
        {block.type === "Divider" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="divider-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="divider-color"
                  type="color"
                  value={props.color || "#e0e0e0"}
                  onChange={(e) => onPropertyChange?.("props.color", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={props.color || "#e0e0e0"}
                  onChange={(e) => onPropertyChange?.("props.color", e.target.value)}
                  placeholder="#e0e0e0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="divider-height">Height (px)</Label>
              <Input
                id="divider-height"
                type="number"
                value={props.height || 1}
                onChange={(e) => onPropertyChange?.("props.height", parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <Separator />
          </>
        )}

        {/* Color Properties */}
        {(block.style?.backgroundColor || block.style?.textColor) && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label>Colors</Label>
              </div>

              {block.style.textColor && (
                <div className="space-y-2">
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={block.style.textColor}
                      onChange={(e) => onPropertyChange?.("style.textColor", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={block.style.textColor}
                      onChange={(e) => onPropertyChange?.("style.textColor", e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              )}

              {block.style.backgroundColor && (
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={block.style.backgroundColor}
                      onChange={(e) => onPropertyChange?.("style.backgroundColor", e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={block.style.backgroundColor}
                      onChange={(e) => onPropertyChange?.("style.backgroundColor", e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Padding */}
        {block.style?.padding && (
          <div className="space-y-2">
            <Label>Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="padding-top" className="text-xs">Top</Label>
                <Input
                  id="padding-top"
                  type="number"
                  value={block.style.padding.top || 0}
                  onChange={(e) =>
                    onPropertyChange?.("style.padding", {
                      ...block.style.padding,
                      top: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="padding-right" className="text-xs">Right</Label>
                <Input
                  id="padding-right"
                  type="number"
                  value={block.style.padding.right || 0}
                  onChange={(e) =>
                    onPropertyChange?.("style.padding", {
                      ...block.style.padding,
                      right: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="padding-bottom" className="text-xs">Bottom</Label>
                <Input
                  id="padding-bottom"
                  type="number"
                  value={block.style.padding.bottom || 0}
                  onChange={(e) =>
                    onPropertyChange?.("style.padding", {
                      ...block.style.padding,
                      bottom: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="padding-left" className="text-xs">Left</Label>
                <Input
                  id="padding-left"
                  type="number"
                  value={block.style.padding.left || 0}
                  onChange={(e) =>
                    onPropertyChange?.("style.padding", {
                      ...block.style.padding,
                      left: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
