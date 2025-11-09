/**
 * Translation Item Component
 * Individual translatable item with editor
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { updateSingleTranslation } from "@/app/actions/translations";
import { toast } from "sonner";

interface TranslationItemProps {
  translation: {
    blockId: string;
    translationKey: string;
    blockType: string;
    originalText: string;
    translatedText: string;
    status: string;
    context?: string;
    translationId?: string;
  };
  templateId: string;
  languageCode: string;
  onUpdate?: () => void;
}

export function TranslationItem({
  translation,
  templateId,
  languageCode,
  onUpdate,
}: TranslationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [translatedText, setTranslatedText] = useState(translation.translatedText);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTranslatedText(translation.translatedText);
  }, [translation.translatedText]);

  const handleSave = async (status?: "PENDING" | "TRANSLATED" | "REVIEWED") => {
    if (translatedText === translation.translatedText && !status) {
      return; // No changes
    }

    setIsSaving(true);
    try {
      const result = await updateSingleTranslation(
        templateId,
        languageCode,
        translation.translationKey,
        translation.blockId,
        translatedText,
        status || "TRANSLATED"
      );

      if (result.success) {
        if (!status) {
          // Auto-save doesn't show toast
          onUpdate?.();
        } else {
          toast.success("Translation saved");
          setIsEditing(false);
          onUpdate?.();
        }
      } else {
        toast.error(result.error || "Failed to save translation");
      }
    } catch (error) {
      toast.error("Failed to save translation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = () => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save (2 seconds)
    const timeout = setTimeout(() => {
      handleSave();
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const handleTextChange = (value: string) => {
    setTranslatedText(value);
    if (isEditing) {
      handleAutoSave();
    }
  };

  const isComplete = translation.status === "TRANSLATED" || translation.status === "REVIEWED";
  const isMissing = !translatedText || translatedText === translation.originalText;

  const getBlockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      heading: "Heading",
      button: "Button",
      list: "List",
      hero: "Hero",
      quote: "Quote",
    };
    return labels[type] || type;
  };

  return (
    <Card className={isMissing ? "border-orange-200 bg-orange-50" : ""}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getBlockTypeLabel(translation.blockType)}
            </Badge>
            {translation.context && (
              <span className="text-xs text-gray-500">{translation.context}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <Badge variant="default" className="bg-green-500 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Translated
              </Badge>
            )}
            {isMissing && (
              <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                Missing
              </Badge>
            )}
          </div>
        </div>

        {/* Original Text */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Original:</label>
          <div className="text-sm bg-gray-50 border rounded p-2 text-gray-700">
            {translation.originalText}
          </div>
        </div>

        {/* Translation Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Translation:</label>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={translatedText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="min-h-[80px] text-sm"
                placeholder="Enter translation..."
                onBlur={() => {
                  // Save on blur
                  handleSave();
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {translatedText.length} characters
                </span>
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTranslatedText(translation.translatedText);
                      setIsEditing(false);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave("TRANSLATED")}
                    disabled={isSaving}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="text-sm bg-white border rounded p-2 cursor-text min-h-[40px]"
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
            >
              {translatedText || (
                <span className="text-gray-400 italic">Click to translate...</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

