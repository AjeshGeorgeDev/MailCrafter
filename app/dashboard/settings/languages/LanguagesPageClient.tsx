/**
 * Language Settings Page Client Component
 * Client-side wrapper for language management
 */

"use client";

import React, { useState, useEffect } from "react";
import { LanguageTable } from "@/components/settings/LanguageTable";
import { AddLanguageDialog } from "@/components/settings/AddLanguageDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLanguages, getDefaultLanguage } from "@/app/actions/languages";

interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

interface LanguagesPageClientProps {
  initialLanguages: Language[];
  initialDefaultLanguage: string;
  isAdmin: boolean;
}

export function LanguagesPageClient({
  initialLanguages,
  initialDefaultLanguage,
  isAdmin,
}: LanguagesPageClientProps) {
  const [languages, setLanguages] = useState<Language[]>(initialLanguages);
  const [defaultLanguage, setDefaultLanguage] = useState<string>(initialDefaultLanguage);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [languagesResult, defaultResult] = await Promise.all([
        getLanguages(),
        getDefaultLanguage(),
      ]);

      if (languagesResult.success) {
        setLanguages(languagesResult.languages);
      }
      if (defaultResult.success) {
        setDefaultLanguage(defaultResult.defaultLanguage);
      }
    } catch (error) {
      console.error("Failed to refresh languages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Language Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage languages available for email templates
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Languages</CardTitle>
              <CardDescription>
                Enable or disable languages for your organization. Set a default
                language for new templates.
              </CardDescription>
            </div>
            {isAdmin && <AddLanguageDialog onSuccess={refreshData} />}
          </div>
        </CardHeader>
        <CardContent>
          <LanguageTable
            languages={languages}
            defaultLanguage={defaultLanguage}
            onUpdate={refreshData}
          />
        </CardContent>
      </Card>

      {!isAdmin && (
        <div className="mt-4 text-sm text-gray-500">
          * Admin access required to modify language settings
        </div>
      )}
    </div>
  );
}

