/**
 * Variable Panel Component
 * Shows available variables grouped by category
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Variable, 
  Search, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  User,
  Building2,
  Package,
  ShoppingCart,
} from "lucide-react";
import { 
  type VariableDefinition,
} from "@/lib/email/variable-definitions";
import { getCustomVariables } from "@/app/actions/custom-variables";
import { toast } from "sonner";

interface VariablePanelProps {
  onInsert?: (variable: string) => void;
  trigger?: React.ReactNode;
}

const categoryIcons = {
  User: User,
  Company: Building2,
  Product: Package,
  Order: ShoppingCart,
  Custom: Variable,
};

export function VariablePanel({ onInsert, trigger }: VariablePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customVariables, setCustomVariables] = useState<VariableDefinition[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  
  // Load custom variables when panel opens
  useEffect(() => {
    if (isOpen) {
      loadCustomVariables();
    }
  }, [isOpen]);

  const loadCustomVariables = async () => {
    setIsLoadingCustom(true);
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
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Only use custom variables
  const customCategories: Record<string, VariableDefinition[]> = {};
  
  customVariables.forEach(variable => {
    const category = variable.category || "Custom";
    if (!customCategories[category]) {
      customCategories[category] = [];
    }
    customCategories[category].push(variable);
  });

  const allCategories = customCategories;
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(allCategories))
  );

  // Update expanded categories when allCategories changes
  useEffect(() => {
    setExpandedCategories(new Set(Object.keys(allCategories)));
  }, [customVariables.length]);

  // Filter variables based on search
  const filteredCategories = Object.keys(allCategories).reduce((acc, category) => {
    const filtered = allCategories[category].filter(variable =>
      variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    
    return acc;
  }, {} as Record<string, VariableDefinition[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleInsert = (variable: VariableDefinition) => {
    const variableString = `{{${variable.path}}}`;
    
    if (onInsert) {
      onInsert(variableString);
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(variableString);
      toast.success(`Copied ${variable.path} to clipboard`);
    }
  };

  const handleCopy = (variable: VariableDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    const variableString = `{{${variable.path}}}`;
    navigator.clipboard.writeText(variableString);
    toast.success(`Copied ${variable.path}`);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" title="Insert Variables (Ctrl+K)">
      <Variable className="h-4 w-4 mr-2" />
      Variables
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Insert Variable</SheetTitle>
          <SheetDescription>
            Click a variable to insert it into your template
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Variables List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {Object.keys(filteredCategories).map((category) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || Variable;
                const isExpanded = expandedCategories.has(category);
                const variables = filteredCategories[category];

                return (
                  <div key={category} className="border rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary" className="ml-2">
                          {variables.length}
                        </Badge>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t">
                        {variables.map((variable) => (
                          <div
                            key={variable.path}
                            className="p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer transition-colors"
                            onClick={() => handleInsert(variable)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {variable.path}
                                  </code>
                                  <Badge variant="outline" className="text-xs">
                                    {variable.type}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {variable.name}
                                </p>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {variable.description}
                                </p>
                                {variable.sampleValue && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Sample: {typeof variable.sampleValue === 'object' 
                                      ? JSON.stringify(variable.sampleValue).slice(0, 50) + '...'
                                      : String(variable.sampleValue)}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => handleCopy(variable, e)}
                                  title="Copy variable"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {Object.keys(filteredCategories).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No variables found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

