/**
 * Variable Inserter Component
 * Command palette for quick variable insertion
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Variable } from "lucide-react";
import { 
  type VariableDefinition,
} from "@/lib/email/variable-definitions";
import { getCustomVariables } from "@/app/actions/custom-variables";

interface VariableInserterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (variable: string) => void;
}

export function VariableInserter({ 
  open, 
  onOpenChange, 
  onSelect 
}: VariableInserterProps) {
  const [search, setSearch] = useState("");
  const [customVariables, setCustomVariables] = useState<VariableDefinition[]>([]);

  // Load custom variables when dialog opens
  useEffect(() => {
    if (open) {
      loadCustomVariables();
    }
  }, [open]);

  const loadCustomVariables = async () => {
    try {
      const result = await getCustomVariables();
      if (result.success && result.variables) {
        const converted = result.variables.map((v: any) => ({
          name: v.name,
          path: v.path,
          description: v.description || "",
          type: v.type as VariableDefinition["type"],
          sampleValue: v.sampleValue,
          category: v.category || "Custom",
        }));
        setCustomVariables(converted);
      }
    } catch (error) {
      console.error("Failed to load custom variables:", error);
    }
  };

  const handleSelect = (variable: VariableDefinition) => {
    const variableString = `{{${variable.path}}}`;
    if (onSelect) {
      onSelect(variableString);
    }
    onOpenChange(false);
    setSearch("");
  };

  // Only use custom variables
  const allVariables = customVariables;

  // Filter variables based on search
  const filteredVariables = allVariables.filter(variable =>
    variable.name.toLowerCase().includes(search.toLowerCase()) ||
    variable.path.toLowerCase().includes(search.toLowerCase()) ||
    variable.description.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedVariables = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, VariableDefinition[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search variables..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No variables found.</CommandEmpty>
        {Object.keys(groupedVariables).map((category) => (
          <CommandGroup key={category} heading={category}>
            {groupedVariables[category].map((variable) => (
              <CommandItem
                key={variable.path}
                value={variable.path}
                onSelect={() => handleSelect(variable)}
                className="flex items-start gap-2 py-3"
              >
                <Variable className="h-4 w-4 mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">
                      {variable.path}
                    </code>
                  </div>
                  <p className="text-sm font-medium">{variable.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {variable.description}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook to use variable inserter with keyboard shortcut
 */
export function useVariableInserter(onSelect: (variable: string) => void) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open variable inserter
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
    openVariableInserter: () => setIsOpen(true),
    VariableInserter: () => (
      <VariableInserter
        open={isOpen}
        onOpenChange={setIsOpen}
        onSelect={onSelect}
      />
    ),
  };
}

