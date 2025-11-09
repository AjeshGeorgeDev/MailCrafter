"use client";

/**
 * TipTap-based Email Builder
 * Inspired by maily.to architecture
 * https://github.com/arikchakma/maily.to
 * Uses TipTap (ProseMirror) as the core editor engine
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Eye,
  Type,
  Heading as HeadingIcon,
  MousePointerClick,
  Image as ImageIcon,
  Container,
  Minus,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { renderToStaticMarkup } from "@/lib/email/renderer-standalone";
import { EmailDocument } from "@/lib/email/types";
import { EmailButton } from "@/lib/tiptap/extensions/email-button";
import { EmailSpacer } from "@/lib/tiptap/extensions/email-spacer";
import { EmailDivider } from "@/lib/tiptap/extensions/email-divider";
import { EmailContainer } from "@/lib/tiptap/extensions/email-container";
import { useEffect, useState, useCallback, useRef } from "react";

interface TipTapEmailBuilderProps {
  initialStructure?: EmailDocument;
  onSave?: (structure: EmailDocument) => void;
  autoSaveInterval?: number;
  onDocumentChange?: (document: EmailDocument) => void;
}

export function TipTapEmailBuilder({
  initialStructure,
  onSave,
  autoSaveInterval = 30000,
  onDocumentChange,
}: TipTapEmailBuilderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Convert EmailDocument to TipTap JSON
  const convertEmailDocToTipTapJSON = (emailDoc?: EmailDocument): any => {
    if (!emailDoc || !emailDoc.root?.data?.childrenIds) {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "" }],
          },
        ],
      };
    }

    const blocks = emailDoc.root.data.childrenIds
      .map((blockId) => {
        const block = emailDoc[blockId];
        if (!block) return null;

        switch (block.type) {
          case "Heading":
            return {
              type: "heading",
              attrs: { level: (block as any).props?.level || 2 },
              content: [
                {
                  type: "text",
                  text: (block as any).props?.text || "",
                },
              ],
            };

          case "Text":
            return {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: (block as any).props?.text || "",
                },
              ],
            };

          case "Button":
            return {
              type: "emailButton",
              attrs: {
                text: (block as any).props?.text || "Click me",
                link: (block as any).props?.link || "#",
                backgroundColor: (block as any).props?.backgroundColor || "#007bff",
                textColor: (block as any).props?.textColor || "#ffffff",
                align: (block as any).props?.align || "center",
              },
            };

          case "Image":
            return {
              type: "image",
              attrs: {
                src: (block as any).props?.src || "",
                alt: (block as any).props?.alt || "",
              },
            };

          case "Spacer":
            return {
              type: "emailSpacer",
              attrs: {
                height: (block as any).props?.height || 20,
              },
            };

          case "Divider":
            return {
              type: "emailDivider",
              attrs: {
                color: (block as any).props?.color || "#e0e0e0",
                height: (block as any).props?.height || 1,
              },
            };

          case "Container":
            const containerChildrenIds = (block as any).props?.childrenIds || [];
            const containerContent = containerChildrenIds
              .map((childId: string) => {
                const childBlock = emailDoc[childId];
                if (!childBlock) return null;

                if (childBlock.type === "Text") {
                  return {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: (childBlock as any).props?.text || "",
                      },
                    ],
                  };
                }
                return null;
              })
              .filter(Boolean);

            return {
              type: "emailContainer",
              attrs: {
                backgroundColor: (block as any).props?.backgroundColor || "transparent",
              },
              content: containerContent.length > 0 ? containerContent : [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Drop blocks here" }],
                },
              ],
            };

          default:
            return null;
        }
      })
      .filter((block): block is NonNullable<typeof block> => block !== null);

    return {
      type: "doc",
      content: blocks,
    };
  };

  // Convert TipTap JSON to EmailDocument
  const convertTipTapJSONToEmailDoc = (tipTapJSON: any): EmailDocument => {
    const childrenIds: string[] = [];
    const document: EmailDocument = {
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

    if (!tipTapJSON?.content) {
      return document;
    }

    tipTapJSON.content.forEach((node: any, index: number) => {
      const blockId = `block-${Date.now()}-${index}`;
      childrenIds.push(blockId);

      switch (node.type) {
        case "heading":
          const headingText = node.content?.[0]?.text || "";
          document[blockId] = {
            type: "Heading",
            id: blockId,
            props: {
              text: headingText,
              level: (node.attrs?.level || 2) as 1 | 2 | 3 | 4 | 5 | 6,
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "paragraph":
          const paraText = node.content?.map((c: any) => c.text || "").join("") || "";
          document[blockId] = {
            type: "Text",
            id: blockId,
            props: {
              text: paraText,
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "emailButton":
          document[blockId] = {
            type: "Button",
            id: blockId,
            props: {
              text: node.attrs?.text || "Click me",
              link: node.attrs?.link || "#",
              backgroundColor: node.attrs?.backgroundColor || "#007bff",
              textColor: node.attrs?.textColor || "#ffffff",
              align: (node.attrs?.align as "left" | "center" | "right") || "center",
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "image":
          document[blockId] = {
            type: "Image",
            id: blockId,
            props: {
              src: node.attrs?.src || "",
              alt: node.attrs?.alt || "",
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "emailSpacer":
          document[blockId] = {
            type: "Spacer",
            id: blockId,
            props: {
              height: node.attrs?.height || 20,
            },
            style: {},
          };
          break;

        case "emailDivider":
          document[blockId] = {
            type: "Divider",
            id: blockId,
            props: {
              color: node.attrs?.color || "#e0e0e0",
              height: node.attrs?.height || 1,
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "emailContainer":
          // Extract children from container
          const containerChildrenIds: string[] = [];
          if (node.content) {
            node.content.forEach((childNode: any, childIndex: number) => {
              const childId = `${blockId}-child-${childIndex}`;
              containerChildrenIds.push(childId);

              if (childNode.type === "paragraph") {
                const childText = childNode.content?.map((c: any) => c.text || "").join("") || "";
                document[childId] = {
                  type: "Text",
                  id: childId,
                  props: {
                    text: childText,
                  },
                  style: {
                    padding: { top: 8, bottom: 8, left: 16, right: 16 },
                  },
                };
              }
            });
          }

          document[blockId] = {
            type: "Container",
            id: blockId,
            props: {
              backgroundColor: node.attrs?.backgroundColor || "transparent",
              childrenIds: containerChildrenIds,
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
          break;

        case "bulletList":
        case "orderedList":
          // Convert list items to Text blocks
          if (node.content) {
            node.content.forEach((listItem: any, itemIndex: number) => {
              const itemId = `${blockId}-item-${itemIndex}`;
              childrenIds.push(itemId);

              const itemText = listItem.content?.[0]?.content
                ?.map((c: any) => c.text || "")
                .join("") || "";

              document[itemId] = {
                type: "Text",
                id: itemId,
                props: {
                  text: `${node.type === "orderedList" ? `${itemIndex + 1}. ` : "• "}${itemText}`,
                },
                style: {
                  padding: { top: 8, bottom: 8, left: 24, right: 24 },
                },
              };
            });
          }
          // Remove original list block
          childrenIds.splice(childrenIds.indexOf(blockId), 1);
          delete document[blockId];
          break;

        default:
          // Unknown type - create as Text
          document[blockId] = {
            type: "Text",
            id: blockId,
            props: {
              text: JSON.stringify(node),
            },
            style: {
              padding: { top: 16, bottom: 16, left: 24, right: 24 },
            },
          };
      }
    });

    document.root.data.childrenIds = childrenIds;
    return document;
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: "Start building your email template...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color.configure({}),
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "email-link",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "email-image",
        },
      }),
      EmailButton,
      EmailSpacer,
      EmailDivider,
      EmailContainer,
    ],
    content: convertEmailDocToTipTapJSON(initialStructure),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const emailDoc = convertTipTapJSONToEmailDoc(json);
      if (onDocumentChange) {
        onDocumentChange(emailDoc);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const node = selection.$anchor.parent;
      
      // Check if we selected a custom email block
      if (node.type.name === "emailButton" || 
          node.type.name === "emailSpacer" || 
          node.type.name === "emailDivider" || 
          node.type.name === "emailContainer" ||
          node.type.name === "image") {
        setSelectedNode({ type: node.type.name, attrs: node.attrs });
      } else {
        setSelectedNode(null);
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[500px] p-4",
        "data-placeholder": "Start building your email template...",
      },
    },
  });

  // Auto-save
  const saveStructure = useCallback(async () => {
    if (!editor || !onSave) return;

    try {
      setIsSaving(true);
      const json = editor.getJSON();
      const emailDoc = convertTipTapJSONToEmailDoc(json);
      await onSave(emailDoc);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave]);

  useEffect(() => {
    if (autoSaveInterval > 0 && onSave && editor) {
      autoSaveTimerRef.current = setInterval(() => {
        saveStructure();
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, onSave, editor, saveStructure]);

  // Update editor content when initialStructure changes
  useEffect(() => {
    if (editor && initialStructure) {
      const tipTapJSON = convertEmailDocToTipTapJSON(initialStructure);
      editor.commands.setContent(tipTapJSON);
    }
  }, [initialStructure, editor]);

  const handlePreview = async () => {
    if (!editor) return;

    try {
      const json = editor.getJSON();
      const emailDoc = convertTipTapJSONToEmailDoc(json);
      const html = renderToStaticMarkup(emailDoc, { rootBlockId: "root" });

      // Open preview in new window
      const previewWindow = window.open();
      if (previewWindow) {
        previewWindow.document.write(html);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to generate preview");
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Email Template Builder</h2>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-sm text-muted-foreground">Saving...</span>
          ) : lastSaved ? (
            <span className="text-sm text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" onClick={saveStructure} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="border-b bg-white p-2 flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-secondary" : ""}
        >
          <strong>B</strong>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-secondary" : ""}
        >
          <em>I</em>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-secondary" : ""}
        >
          H1
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-secondary" : ""}
        >
          H2
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-secondary" : ""}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-secondary" : ""}
        >
          Left
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-secondary" : ""}
        >
          Center
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-secondary" : ""}
        >
          Right
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block Palette */}
        <div className="w-64 border-r bg-white p-4 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-4">BLOCKS</h3>
          <div className="space-y-2">
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() => editor.chain().focus().insertContent({ type: "paragraph" }).run()}
            >
              <Type className="h-4 w-4" />
              <span className="text-sm">Text</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <HeadingIcon className="h-4 w-4" />
              <span className="text-sm">Heading</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
              <span className="text-sm">List</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() =>
                editor.chain().focus().setEmailButton({ text: "Click me", link: "#" }).run()
              }
            >
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm">Button</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm">Image</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() =>
                editor.chain().focus().setEmailSpacer({ height: 20 }).run()
              }
            >
              <Minus className="h-4 w-4 rotate-90" />
              <span className="text-sm">Spacer</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() =>
                editor.chain().focus().setEmailDivider({ color: "#e0e0e0" }).run()
              }
            >
              <Minus className="h-4 w-4" />
              <span className="text-sm">Divider</span>
            </button>
            <button
              className="w-full text-left p-3 border rounded hover:bg-gray-50 flex items-center gap-2"
              onClick={() =>
                editor.chain().focus().setEmailContainer({ backgroundColor: "transparent" }).run()
              }
            >
              <Container className="h-4 w-4" />
              <span className="text-sm">Container</span>
            </button>
          </div>
        </div>

        {/* Center: TipTap Editor Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-full p-8">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right: Style/Properties Panel */}
        <div className="w-80 border-l bg-white p-4 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-4">PROPERTIES</h3>
          {selectedNode ? (
            <PropertiesPanel editor={editor} selectedNode={selectedNode} />
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Select a block to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Properties Panel Component
function PropertiesPanel({ editor, selectedNode }: { editor: any; selectedNode: any }) {
  if (!selectedNode || !editor) return null;

  const updateAttributes = (attrs: Record<string, any>) => {
    // Find and update the selected node
    const { state } = editor;
    const { selection } = state;
    const { $from, $to } = selection;
    
    // Find the node that matches our selected node type
    state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === selectedNode.type && pos >= $from.pos && pos <= $to.pos) {
        editor.chain()
          .focus()
          .command(({ tr, dispatch }: any) => {
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                ...attrs,
              });
            }
            return true;
          })
          .run();
        return false;
      }
    });
  };

  switch (selectedNode.type) {
    case "emailButton":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="button-text">Button Text</Label>
            <Input
              id="button-text"
              value={selectedNode.attrs.text || "Click me"}
              onChange={(e) =>
                updateAttributes({ text: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="button-link">Link URL</Label>
            <Input
              id="button-link"
              value={selectedNode.attrs.link || "#"}
              onChange={(e) =>
                updateAttributes({ link: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="button-bg-color">Background Color</Label>
            <Input
              id="button-bg-color"
              type="color"
              value={selectedNode.attrs.backgroundColor || "#007bff"}
              onChange={(e) =>
                updateAttributes({ backgroundColor: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="button-text-color">Text Color</Label>
            <Input
              id="button-text-color"
              type="color"
              value={selectedNode.attrs.textColor || "#ffffff"}
              onChange={(e) =>
                updateAttributes({ textColor: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="button-align">Alignment</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={selectedNode.attrs.align === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => updateAttributes({ align: "left" })}
              >
                Left
              </Button>
              <Button
                variant={selectedNode.attrs.align === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => updateAttributes({ align: "center" })}
              >
                Center
              </Button>
              <Button
                variant={selectedNode.attrs.align === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => updateAttributes({ align: "right" })}
              >
                Right
              </Button>
            </div>
          </div>
        </div>
      );

    case "image":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={selectedNode.attrs.src || ""}
              onChange={(e) =>
                editor.chain().focus().setImage({ src: e.target.value }).run()
              }
            />
          </div>
          <div>
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={selectedNode.attrs.alt || ""}
              onChange={(e) =>
                editor.chain().focus().setImage({ alt: e.target.value }).run()
              }
            />
          </div>
        </div>
      );

    case "emailSpacer":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacer-height">Height (px)</Label>
            <Input
              id="spacer-height"
              type="number"
              value={selectedNode.attrs.height || 20}
              onChange={(e) =>
                updateAttributes({ height: parseInt(e.target.value, 10) || 20 })
              }
            />
          </div>
        </div>
      );

    case "emailDivider":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="divider-color">Color</Label>
            <Input
              id="divider-color"
              type="color"
              value={selectedNode.attrs.color || "#e0e0e0"}
              onChange={(e) =>
                updateAttributes({ color: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="divider-height">Height (px)</Label>
            <Input
              id="divider-height"
              type="number"
              value={selectedNode.attrs.height || 1}
              onChange={(e) =>
                updateAttributes({ height: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
        </div>
      );

    case "emailContainer":
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="container-bg-color">Background Color</Label>
            <Input
              id="container-bg-color"
              type="color"
              value={selectedNode.attrs.backgroundColor || "#ffffff"}
              onChange={(e) =>
                updateAttributes({ backgroundColor: e.target.value })
              }
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          <p>No properties available for this block type</p>
        </div>
      );
  }
}

