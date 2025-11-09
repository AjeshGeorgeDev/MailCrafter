/**
 * Translation Panel Component
 * Sidebar for managing translations
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { TranslationItem } from "./TranslationItem";
import {
  extractTranslatableTextAction,
  getTranslations,
  getTranslationProgress,
} from "@/app/actions/translations";
import { Languages, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TranslationPanelProps {
  templateId?: string;
  trigger?: React.ReactNode;
}

export function TranslationPanel({ templateId, trigger }: TranslationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [translations, setTranslations] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (isOpen && templateId) {
      loadTranslations();
      loadProgress();
    }
  }, [isOpen, templateId, selectedLanguage]);

  const loadTranslations = async () => {
    if (!templateId) return;

    setIsLoading(true);
    try {
      const result = await getTranslations(templateId, selectedLanguage);
      if (result.success) {
        setTranslations(result.translations || []);
        setTotalItems(result.translations?.length || 0);
      } else {
        toast.error(result.error || "Failed to load translations");
      }
    } catch (error) {
      toast.error("Failed to load translations");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!templateId) return;

    try {
      const result = await getTranslationProgress(templateId);
      if (result.success) {
        setProgress(result.progress);
        setTotalItems(result.totalItems || 0);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  const handleExtract = async () => {
    if (!templateId) return;

    setIsExtracting(true);
    try {
      const result = await extractTranslatableTextAction(templateId);
      if (result.success) {
        toast.success("Translatable text extracted successfully");
        await loadTranslations();
        await loadProgress();
      } else {
        toast.error(result.error || "Failed to extract translatable text");
      }
    } catch (error) {
      toast.error("Failed to extract translatable text");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTranslationUpdate = () => {
    loadTranslations();
    loadProgress();
  };

  const currentLanguageProgress = progress?.find(
    (p: any) => p.languageCode === selectedLanguage
  );

  const missingCount = translations.filter(
    (t) => t.status === "PENDING" || !t.translatedText || t.translatedText === t.originalText
  ).length;

  const defaultTrigger = (
    <Button variant="outline" size="sm" title="Manage Translations">
      <Languages className="h-4 w-4 mr-2" />
      Translations
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[700px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Translations</SheetTitle>
          <SheetDescription>
            Manage translations for this email template
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                placeholder="Select language"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtract}
              disabled={isExtracting || !templateId}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                "Extract Text"
              )}
            </Button>
          </div>

          {/* Progress */}
          {currentLanguageProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {currentLanguageProgress.languageName}
                </span>
                <span className="text-gray-500">
                  {currentLanguageProgress.translated} / {currentLanguageProgress.total} translated
                </span>
              </div>
              <Progress value={currentLanguageProgress.percentage} />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{currentLanguageProgress.percentage}% complete</span>
                {missingCount > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{missingCount} missing</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Missing Translations Warning */}
          {missingCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {missingCount} translation{missingCount !== 1 ? "s" : ""} missing
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Some content hasn't been translated yet. Review and complete all translations.
                </p>
              </div>
            </div>
          )}

          {/* Translations List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : translations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No translatable text found</p>
                <p className="text-sm">
                  Click "Extract Text" to find translatable content in your template
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {translations.map((translation, index) => (
                  <TranslationItem
                    key={`${translation.blockId}_${translation.translationKey}_${index}`}
                    translation={translation}
                    templateId={templateId!}
                    languageCode={selectedLanguage}
                    onUpdate={handleTranslationUpdate}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

