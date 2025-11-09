"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Eye,
  Smartphone,
  Monitor,
  Mail,
  History,
  Settings,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface EditorToolbarProps {
  onSave?: () => void;
  onPreview?: () => void;
  onTestSend?: () => void;
  onVersionHistory?: () => void;
  onSettings?: () => void;
  onLanguageChange?: (language: string) => void;
  isSaving?: boolean;
  currentLanguage?: string;
  availableLanguages?: string[];
  viewMode?: "desktop" | "mobile";
  onViewModeChange?: (mode: "desktop" | "mobile") => void;
}

export function EditorToolbar({
  onSave,
  onPreview,
  onTestSend,
  onVersionHistory,
  onSettings,
  onLanguageChange,
  isSaving = false,
  currentLanguage = "en",
  availableLanguages = ["en"],
  viewMode = "desktop",
  onViewModeChange,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b bg-white p-4">
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>

        {/* Separator */}
        <div className="h-6 w-px bg-border mx-2" />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange?.("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange?.("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        {/* Language Selector */}
        {availableLanguages.length > 1 && (
          <>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange?.(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Preview Button */}
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>

        {/* Test Send Button */}
        <Button variant="outline" size="sm" onClick={onTestSend}>
          <Mail className="mr-2 h-4 w-4" />
          Test Send
        </Button>

        {/* Version History */}
        <Button variant="ghost" size="sm" onClick={onVersionHistory}>
          <History className="mr-2 h-4 w-4" />
          Versions
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

