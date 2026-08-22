"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadInputProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  bucketName?: string;
  folder?: string;
  placeholder?: string;
}

export function ImageUploadInput({
  name,
  label = "Photo",
  defaultValue = "",
  bucketName = "globetrotter-media",
  folder = "uploads",
  placeholder = "https://example.com/image.jpg",
}: ImageUploadInputProps) {
  const [url, setUrl] = useState<string>(defaultValue || "");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be under 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      const supabase = createClient();

      const fileExt = file.name.split(".").pop() || "jpg";
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
      const filePath = `${folder}/${Date.now()}_${cleanFileName}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        // Provide helpful feedback if bucket isn't configured
        if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found")) {
          throw new Error(
            `Bucket '${bucketName}' not found in Supabase Storage. Please create it or use the Direct Link tab.`
          );
        }
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setUrl(publicData.publicUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setUrl("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-center justify-between">
        <label className="font-medium text-zinc-700">{label}</label>
        <div className="flex rounded-md bg-zinc-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded px-2.5 py-0.5 transition-colors ${
              mode === "upload" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Upload / Drop
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-2.5 py-0.5 transition-colors ${
              mode === "url" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Direct Link
          </button>
        </div>
      </div>

      {/* Hidden input to pass value in form */}
      <input type="hidden" name={name} value={url} />

      {/* Upload / Drag & Drop Mode */}
      {mode === "upload" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
            isDragging
              ? "border-zinc-900 bg-zinc-100/70"
              : "border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 py-2 text-xs font-medium text-zinc-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
              Uploading to Supabase Storage...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs font-medium text-zinc-700">
                <span className="text-blue-600 underline">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-zinc-400">PNG, JPG, WEBP up to 5MB</p>
            </div>
          )}
        </div>
      ) : (
        /* Direct Link Mode */
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs focus:border-zinc-900 focus:outline-none"
          />
          {url ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      )}

      {/* Error Message */}
      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}

      {/* Image Preview */}
      {url ? (
        <div className="mt-1 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Preview"
              className="h-12 w-12 rounded object-cover border bg-zinc-100"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-zinc-800 truncate">Image selected</p>
              <p className="text-[11px] text-zinc-400 truncate max-w-[260px]">{url}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
