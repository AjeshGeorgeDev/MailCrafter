/**
 * Inner Email Builder Component
 * Wraps components that need context access
 */

"use client";

import React, { useState } from "react";
import { BlocksSidebar } from "./BlocksSidebar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { EditorToolbar } from "./EditorToolbar";
import { JsonView } from "./JsonView";
import { HtmlView } from "./HtmlView";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

interface EmailBuilderInnerProps {
  height?: string | number;
}

export function EmailBuilderInner({ height = "100vh" }: EmailBuilderInnerProps) {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  const [activeTab, setActiveTab] = useState<"design" | "json" | "html">("design");

  return (
    <div
      className="flex flex-col h-full bg-gray-50"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {/* Top Toolbar */}
      <EditorToolbar onTabChange={setActiveTab} activeTab={activeTab} />

      {/* Main Editor Area */}
      {activeTab === "design" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Blocks */}
          <BlocksSidebar />

          {/* Center - Canvas */}
          <Canvas />

          {/* Right Sidebar - Properties */}
          <PropertiesPanel />
        </div>
      ) : activeTab === "json" ? (
        <div className="flex-1 overflow-hidden bg-white">
          <JsonView />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden bg-white">
          <HtmlView />
        </div>
      )}
    </div>
  );
}

