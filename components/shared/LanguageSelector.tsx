/**
 * Language Selector Component
 * Reusable dropdown for selecting languages
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLanguages } from "@/app/actions/languages";
import { Loader2 } from "lucide-react";

interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

interface LanguageSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  showInactive?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onValueChange,
  showInactive = false,
  placeholder = "Select language",
  className,
  disabled = false,
}: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const result = await getLanguages();
      if (result.success && result.languages) {
        const filtered = showInactive
          ? result.languages
          : result.languages.filter((lang) => lang.isActive);
        setLanguages(filtered);
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className} disabled={disabled}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {languages.length === 0 ? (
          <div className="p-2 text-sm text-gray-500 text-center">
            No languages available
          </div>
        ) : (
          languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">
                  {language.code.toUpperCase()}
                </span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

