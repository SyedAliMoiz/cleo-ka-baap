"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function FileUpload({
  onFileUpload,
  disabled = false,
  multiple = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      if (multiple) {
        handleFiles(filesArray);
      } else {
        handleFiles([filesArray[0]]);
      }
    }
  };

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (
      !file.type.startsWith("text/") &&
      file.type !== "application/octet-stream"
    ) {
      return `${file.name}: Please upload only text files (.txt)`;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name}: File size must be less than 10MB`;
    }

    return null;
  };

  const handleFiles = async (files: File[]) => {
    if (disabled) return;

    // Validate all files first
    const validationErrors: string[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      }
    }

    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setUploading(true);
    try {
      await onFileUpload(files);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (multiple) {
        handleFiles(filesArray);
      } else {
        handleFiles([filesArray[0]]);
      }
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled
            ? "border-border bg-card cursor-not-allowed opacity-50"
            : dragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-[rgba(0,255,136,0.5)]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/*"
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-muted-foreground">
            <FileText className="w-full h-full" />
          </div>

          <div>
            <p className="text-lg font-medium text-foreground">
              Drop your text {multiple ? "files" : "file"} here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse {multiple ? "files" : "file"}
            </p>
          </div>

          <Button
            type="button"
            onClick={openFileDialog}
            disabled={uploading || disabled}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading
              ? "Uploading..."
              : disabled
              ? "Loading..."
              : multiple
              ? "Choose Files"
              : "Choose File"}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Text files (.txt)</li>
            <li>Maximum file size: 10MB</li>
            <li>Files will be automatically chunked for optimal retrieval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
