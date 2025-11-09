/**
 * CSV Import Component
 * Upload and parse CSV files for campaign recipients
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, XCircle, Download } from "lucide-react";
import { parseCSVFile, detectDuplicates, removeDuplicates, type CSVRecipient } from "@/lib/campaigns/csv-importer";
import { toast } from "sonner";

interface CSVImportProps {
  onImport: (recipients: CSVRecipient[]) => void;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRecipient[] | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [duplicates, setDuplicates] = useState<Array<{ email: string; count: number }>>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (fileToParse: File) => {
    startTransition(async () => {
      try {
        const result = await parseCSVFile(fileToParse);

        if (result.errors.length > 0) {
          setErrors(result.errors);
          toast.warning(`Found ${result.errors.length} errors in CSV`);
        } else {
          setErrors([]);
        }

        // Detect duplicates
        const dupes = detectDuplicates(result.recipients);
        if (dupes.length > 0) {
          setDuplicates(dupes);
          toast.warning(`Found ${dupes.length} duplicate email(s)`);
        } else {
          setDuplicates([]);
        }

        setPreview(result.recipients);
      } catch (error) {
        console.error("Parse CSV error:", error);
        toast.error("Failed to parse CSV file");
      }
    });
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) {
      toast.error("No valid recipients to import");
      return;
    }

    // Remove duplicates before importing
    const uniqueRecipients = removeDuplicates(preview);
    onImport(uniqueRecipients);
    
    // Reset state
    setFile(null);
    setPreview(null);
    setErrors([]);
    setDuplicates([]);
  };

  const downloadSample = () => {
    const sampleCSV = `email,name,firstName,lastName
john.doe@example.com,John Doe,John,Doe
jane.smith@example.com,Jane Smith,Jane,Smith
bob.wilson@example.com,Bob Wilson,Bob,Wilson`;

    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-recipients.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Import Recipients from CSV</Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isPending}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSample}
          >
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          CSV should have an "email" column. Optional columns: name, firstName, lastName, and custom variables.
        </p>
      </div>

      {isPending && (
        <div className="text-sm text-muted-foreground">Parsing CSV...</div>
      )}

      {preview && preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {preview.length} valid recipient{preview.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {duplicates.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-orange-600" />
                    <span>
                      {duplicates.length} duplicate email{duplicates.length !== 1 ? "s" : ""} found. Duplicates will be removed on import.
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Variables</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((recipient, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono text-xs">{recipient.email}</td>
                      <td className="p-2">{recipient.name || "-"}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {recipient.variables
                          ? Object.keys(recipient.variables).length + " variable(s)"
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  ... and {preview.length - 10} more
                </p>
              )}
            </div>

            <Button onClick={handleImport} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Import {preview.length} Recipient{preview.length !== 1 ? "s" : ""}
            </Button>
          </CardContent>
        </Card>
      )}

      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errors</CardTitle>
            <CardDescription>
              {errors.length} error{errors.length !== 1 ? "s" : ""} found in CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {errors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm text-red-600">
                  Row {error.row}: {error.error}
                </div>
              ))}
              {errors.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  ... and {errors.length - 10} more errors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

