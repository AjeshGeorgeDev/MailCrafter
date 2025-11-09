/**
 * JSON View Component
 * Shows and allows editing of raw JSON
 */

"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEmailBuilder } from "./EmailBuilderContext";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function JsonView() {
  const { state, setDocument } = useEmailBuilder();
  const [jsonText, setJsonText] = useState(JSON.stringify(state.document, null, 2));
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    setJsonText(JSON.stringify(state.document, null, 2));
  }, [state.document]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      // Basic validation
      if (!parsed.childrenIds || !Array.isArray(parsed.childrenIds)) {
        throw new Error("Invalid document structure: missing childrenIds");
      }
      setDocument(parsed);
      setIsEditing(false);
      toast.success("JSON applied successfully");
    } catch (error: any) {
      toast.error(`Invalid JSON: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setJsonText(JSON.stringify(state.document, null, 2));
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    toast.success("JSON copied to clipboard");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <h3 className="font-semibold">JSON Editor</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
          >
            Copy
          </Button>
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
              >
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setIsEditing(true);
          }}
          className="font-mono text-sm h-full resize-none"
          readOnly={!isEditing}
        />
      </div>
    </div>
  );
}

