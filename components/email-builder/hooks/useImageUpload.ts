/**
 * Image Upload Hook
 * Handles image uploads for the email builder
 */

import { useState } from "react";
import { toast } from "sonner";

interface UseImageUploadOptions {
  templateId?: string;
}

export function useImageUpload({ templateId }: UseImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!templateId) {
      toast.error("Template ID is required for image upload");
      return null;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/templates/${templateId}/upload-image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      toast.success("Image uploaded successfully");
      return data.url;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
  };
}

