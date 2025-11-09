/**
 * Test Send Dialog Component
 * Send test emails with sample data
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2 } from "lucide-react";
import { useEmailActions } from "@/components/email-builder/hooks/useEmailActions";
import { useEmailBuilder } from "@/components/email-builder/EmailBuilderContext";
import { getCustomVariables } from "@/app/actions/custom-variables";
import { getDefaultLanguage } from "@/app/actions/languages";
import { toast } from "sonner";

interface TestSendDialogProps {
  templateId?: string;
  templateName?: string;
  trigger?: React.ReactNode;
}

export function TestSendDialog({ 
  templateId, 
  templateName,
  trigger 
}: TestSendDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(`${templateName || "Email Template"} - Test`);
  const [sampleDataMode, setSampleDataMode] = useState<"form" | "json">("json");
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [jsonData, setJsonData] = useState("{}");
  const [defaultLanguage, setDefaultLanguage] = useState<string>("en");

  // Load custom variables and default language on mount
  useEffect(() => {
    loadCustomVariables();
    loadDefaultLanguage();
  }, []);

  const loadDefaultLanguage = async () => {
    try {
      const result = await getDefaultLanguage();
      if (result.success) {
        setDefaultLanguage(result.defaultLanguage);
      }
    } catch (error) {
      console.error("Failed to load default language:", error);
    }
  };

  const loadCustomVariables = async () => {
    try {
      const result = await getCustomVariables();
      if (result.success && result.variables) {
        const customData: Record<string, any> = {};
        result.variables.forEach((v: any) => {
          const pathParts = v.path.split(".");
          if (pathParts[0] === "custom" && pathParts.length > 1) {
            const key = pathParts.slice(1).join(".");
            if (!customData.custom) {
              customData.custom = {};
            }
            customData.custom[key] = v.sampleValue || getDefaultSampleValue(v.type);
          } else {
            setNestedValue(customData, v.path, v.sampleValue || getDefaultSampleValue(v.type));
          }
        });
        setSampleData(customData);
        setJsonData(JSON.stringify(customData, null, 2));
      }
    } catch (error) {
      console.error("Failed to load custom variables:", error);
    }
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
  
  const { state } = useEmailBuilder();
  const { sendPreviewEmail, isSendingPreview } = useEmailActions({
    templateId,
    templateName,
  });

  const handleSend = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    // Parse sample data if in JSON mode
    let dataToUse = sampleData;
    if (sampleDataMode === "json") {
      try {
        dataToUse = JSON.parse(jsonData);
      } catch (error) {
        toast.error("Invalid JSON format");
        return;
      }
    }

    // Send email - template already has its language set
    const success = await sendPreviewEmail(
      state.document,
      email,
      subject,
      undefined, // No language override - use template's defaultLanguage
      dataToUse,
      defaultLanguage
    );
    
    if (success) {
      setIsOpen(false);
      setEmail("");
      setSubject(`${templateName || "Email Template"} - Test`);
    }
  };

  const handleLoadSample = () => {
    loadCustomVariables();
    toast.success("Sample data loaded from custom variables");
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Send className="h-4 w-4 mr-2" />
      Test Send
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email to preview how your template looks with variables replaced
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <Label htmlFor="test-subject">Subject</Label>
            <Input
              id="test-subject"
              type="text"
              placeholder="Test Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Sample Data Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sample Data</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                type="button"
              >
                Load Sample
              </Button>
            </div>
            
            <Tabs value={sampleDataMode} onValueChange={(v) => setSampleDataMode(v as "form" | "json")}>
              <TabsList>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              
              <TabsContent value="form" className="space-y-2 mt-4">
                <div className="text-sm text-gray-500 mb-2">
                  Edit sample data for variables (form view coming soon - use JSON for now)
                </div>
              </TabsContent>
              
              <TabsContent value="json" className="mt-4">
                <Textarea
                  value={jsonData}
                  onChange={(e) => {
                    setJsonData(e.target.value);
                    try {
                      setSampleData(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm h-64"
                  placeholder='{"user": {"name": "John Doe", "email": "john@example.com"}}'
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter JSON data to replace variables in the template
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSendingPreview}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSendingPreview || !email || !subject}
          >
            {isSendingPreview ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

