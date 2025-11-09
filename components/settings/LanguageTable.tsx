/**
 * Language Table Component
 * Displays languages in a table with status toggles and default indicator
 */

"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarOff } from "lucide-react";
import { toggleLanguageStatus, setDefaultLanguage } from "@/app/actions/languages";
import { toast } from "sonner";

interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

interface LanguageTableProps {
  languages: Language[];
  defaultLanguage?: string;
  onUpdate?: () => void;
}

export function LanguageTable({ languages, defaultLanguage, onUpdate }: LanguageTableProps) {
  const [updating, setUpdating] = React.useState<string | null>(null);

  const handleToggle = async (code: string) => {
    setUpdating(code);
    try {
      const result = await toggleLanguageStatus(code);
      if (result.success) {
        toast.success(`Language ${result.isActive ? "enabled" : "disabled"}`);
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to update language");
      }
    } catch (error) {
      toast.error("Failed to update language");
    } finally {
      setUpdating(null);
    }
  };

  const handleSetDefault = async (code: string) => {
    setUpdating(code);
    try {
      const result = await setDefaultLanguage(code);
      if (result.success) {
        toast.success(`Default language set to ${code.toUpperCase()}`);
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to set default language");
      }
    } catch (error) {
      toast.error("Failed to set default language");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Language</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Default</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {languages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
              No languages found
            </TableCell>
          </TableRow>
        ) : (
          languages.map((language) => (
            <TableRow key={language.code}>
              <TableCell className="font-medium">{language.name}</TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {language.code.toUpperCase()}
                </code>
              </TableCell>
              <TableCell>
                <Switch
                  checked={language.isActive}
                  onCheckedChange={() => handleToggle(language.code)}
                  disabled={updating === language.code}
                />
              </TableCell>
              <TableCell>
                {defaultLanguage === language.code ? (
                  <Badge variant="default" className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(language.code)}
                  disabled={
                    updating === language.code ||
                    defaultLanguage === language.code ||
                    !language.isActive
                  }
                  title={
                    defaultLanguage === language.code
                      ? "Already default"
                      : !language.isActive
                      ? "Enable language first"
                      : "Set as default"
                  }
                >
                  {defaultLanguage === language.code ? (
                    <Star className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

