/**
 * Preview Dialog Component
 * Shows email preview in modal with device sizes and dark mode
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, Copy, Download, Moon, Sun, Monitor } from "lucide-react";
import { useEmailBuilder } from "./EmailBuilderContext";
import { renderEmailTemplate } from "@/lib/email/template-renderer";
import { getCustomVariables } from "@/app/actions/custom-variables";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

type DeviceSize = "desktop" | "iphone-se" | "iphone-12" | "pixel" | "ipad" | "custom";
type DarkMode = "light" | "dark" | "auto";

const DEVICE_SIZES: Record<DeviceSize, { width: number; label: string }> = {
  desktop: { width: 600, label: "Desktop" },
  "iphone-se": { width: 375, label: "iPhone SE" },
  "iphone-12": { width: 390, label: "iPhone 12" },
  pixel: { width: 412, label: "Pixel" },
  ipad: { width: 768, label: "iPad" },
  custom: { width: 600, label: "Custom" },
};

export function PreviewDialog() {
  const { state, templateId } = useEmailBuilder();
  const [isOpen, setIsOpen] = useState(false);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [customWidth, setCustomWidth] = useState(600);
  const [darkMode, setDarkMode] = useState<DarkMode>("light");
  const [html, setHtml] = useState("");
  const [showVariables, setShowVariables] = useState(true);
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [missingTranslations, setMissingTranslations] = useState<string[]>([]);

  // Load custom variables and merge with sample data
  useEffect(() => {
    if (isOpen && showVariables) {
      loadCustomVariablesForPreview();
    }
  }, [isOpen, showVariables]);

  // Reload preview when variables change
  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen, showVariables, sampleData]);

  const loadCustomVariablesForPreview = async () => {
    try {
      const result = await getCustomVariables();
      if (result.success && result.variables) {
        // Build custom object from variables
        const customData: Record<string, any> = {};
        result.variables.forEach((v: any) => {
          // Parse path like "custom.discountCode" -> { custom: { discountCode: value } }
          const pathParts = v.path.split(".");
          if (pathParts[0] === "custom" && pathParts.length > 1) {
            const key = pathParts.slice(1).join(".");
            if (!customData.custom) {
              customData.custom = {};
            }
            customData.custom[key] = v.sampleValue || getDefaultSampleValue(v.type);
          } else {
            // Handle non-custom paths (direct paths)
            const pathValue = v.sampleValue || getDefaultSampleValue(v.type);
            setNestedValue(customData, v.path, pathValue);
          }
        });
        
        setSampleData(customData);
      } else {
        setSampleData({});
      }
    } catch (error) {
      console.error("Failed to load custom variables for preview:", error);
      setSampleData({});
    }
  };

  const setNestedValue = (obj: Record<string, any>, path: string, value: any) => {
    const parts = path.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  };

  const getDefaultSampleValue = (type: string): any => {
    switch (type) {
      case "number": return 0;
      case "boolean": return false;
      case "array": return [];
      case "object": return {};
      default: return "";
    }
  };

  const loadPreview = async () => {
    if (!isOpen) return;

    try {
      // Each template has its own language, so we don't need to change it
      const result = await renderEmailTemplate(state.document, {
        sampleData: showVariables ? sampleData : {},
        replaceVariables: showVariables,
        // Template already has its language set via defaultLanguage field
      });
      setHtml(result.html);
      if (result.missingTranslations) {
        setMissingTranslations(result.missingTranslations);
      } else {
        setMissingTranslations([]);
      }
    } catch (error) {
      console.error("Preview error:", error);
      // Fallback to basic render
      const { renderToStaticMarkup } = await import("@/lib/email-builder/renderer");
      setHtml(renderToStaticMarkup(state.document));
      setMissingTranslations([]);
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
  };

  const handleDownloadHTML = () => {
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

  const getPreviewWidth = () => {
    if (deviceSize === "custom") {
      return customWidth;
    }
    return DEVICE_SIZES[deviceSize].width;
  };

  const getDarkModeClass = () => {
    if (darkMode === "dark") return "dark";
    if (darkMode === "auto") {
      // Check system preference
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "";
      }
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Preview">
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Device Size Selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Device:</Label>
                <Select value={deviceSize} onValueChange={(v) => setDeviceSize(v as DeviceSize)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEVICE_SIZES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviceSize === "custom" && (
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 600)}
                    className="w-20"
                    min={200}
                    max={1200}
                  />
                )}
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Theme:</Label>
                <Select value={darkMode} onValueChange={(v) => setDarkMode(v as DarkMode)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <Sun className="h-4 w-4 inline mr-2" />
                      Light
                    </SelectItem>
                    <SelectItem value="dark">
                      <Moon className="h-4 w-4 inline mr-2" />
                      Dark
                    </SelectItem>
                    <SelectItem value="auto">
                      <Monitor className="h-4 w-4 inline mr-2" />
                      Auto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variables Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-variables"
                  checked={showVariables}
                  onChange={(e) => setShowVariables(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="show-variables" className="text-sm cursor-pointer">
                  Show Variables
                </Label>
              </div>

            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyHTML}>
                <Copy className="h-4 w-4 mr-1" />
                Copy HTML
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                Open in Tab
              </Button>
            </div>
          </div>

          {/* Missing Translations Warning */}
          {missingTranslations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  Translation Warning
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {missingTranslations.join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Preview Frame */}
          <div className={`flex-1 overflow-auto border rounded bg-gray-100 p-4 ${getDarkModeClass()}`}>
            <div
              style={{
                width: `${getPreviewWidth()}px`,
                margin: "0 auto",
                backgroundColor: darkMode === "dark" ? "#1a1a1a" : "#ffffff",
                minHeight: "400px",
                transition: "background-color 0.3s",
              }}
            >
              <iframe
                srcDoc={html}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                  backgroundColor: darkMode === "dark" ? "#1a1a1a" : "#ffffff",
                }}
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

