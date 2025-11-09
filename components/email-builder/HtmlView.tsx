/**
 * HTML View Component
 * Shows generated HTML (read-only)
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useEmailBuilder } from "./EmailBuilderContext";
import { toast } from "sonner";
import { Copy, Download, ExternalLink } from "lucide-react";

export function HtmlView() {
  const { state } = useEmailBuilder();
  const [html, setHtml] = useState("");

  useEffect(() => {
    const loadRenderer = async () => {
      try {
        const { renderToStaticMarkup } = await import("@/lib/email-builder/renderer");
        const generatedHtml = renderToStaticMarkup(state.document);
        setHtml(generatedHtml);
      } catch (error) {
        console.error("Error loading renderer:", error);
        setHtml("<!-- Error loading HTML renderer -->");
      }
    };
    loadRenderer();
  }, [state.document]);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-template.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded");
  };

  const handleOpenInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <h3 className="font-semibold">HTML Preview</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenInNewTab}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto h-full font-mono">
          <code>{html || "Loading HTML..."}</code>
        </pre>
      </div>
    </div>
  );
}

