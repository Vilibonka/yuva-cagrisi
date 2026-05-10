"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, X, ImagePlus, Star } from "lucide-react";
import { buildMediaUrl } from "@/api";

export interface ExistingImage {
  id: string;
  url: string;
}

interface ImageUploadDropzoneProps {
  onFilesChange: (files: File[]) => void;
  onKeptImagesChange?: (urls: string[]) => void;
  maxFiles?: number;
  initialImages?: ExistingImage[];
}

export function ImageUploadDropzone({ onFilesChange, onKeptImagesChange, maxFiles = 5, initialImages = [] }: ImageUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [keptImages, setKeptImages] = useState<ExistingImage[]>(initialImages);

  // Initialize kept images when prop changes (for data fetching)
  React.useEffect(() => {
    setKeptImages(initialImages);
    if (onKeptImagesChange) {
      onKeptImagesChange(initialImages.map(img => img.url));
    }
  }, [initialImages]);

  // Derived previews
  const previews = [
    ...keptImages.map((img) => img.url),
    ...selectedFiles.map((file) => {
      // Using a small hack to cache object URLs to avoid recreation
      if (!(file as any)._preview) {
        (file as any)._preview = URL.createObjectURL(file);
      }
      return (file as any)._preview;
    })
  ];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const imageFiles = filesArray.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    const currentTotal = keptImages.length + selectedFiles.length;
    const remainingSlots = maxFiles - currentTotal;
    
    if (remainingSlots <= 0) return;

    const allowedNewFiles = imageFiles.slice(0, remainingSlots);
    const newSelected = [...selectedFiles, ...allowedNewFiles];
    
    setSelectedFiles(newSelected);
    onFilesChange(newSelected);
  };

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [selectedFiles, maxFiles]);

  const removeFile = (indexToRemove: number) => {
    if (indexToRemove < keptImages.length) {
      // Remove an existing image
      const newKept = keptImages.filter((_, idx) => idx !== indexToRemove);
      setKeptImages(newKept);
      if (onKeptImagesChange) {
        onKeptImagesChange(newKept.map(img => img.url));
      }
    } else {
      // Remove a newly selected file
      const selectedIndex = indexToRemove - keptImages.length;
      const fileToRemove = selectedFiles[selectedIndex];
      if ((fileToRemove as any)._preview) {
        URL.revokeObjectURL((fileToRemove as any)._preview);
      }
      const updatedFiles = selectedFiles.filter((_, idx) => idx !== selectedIndex);
      setSelectedFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full rounded-2xl transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
          ${previews.length > 0 ? 'h-32' : 'h-44'}
          ${dragActive
            ? "border-2 border-orange-400 bg-orange-50 shadow-lg shadow-orange-500/10"
            : "border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-orange-50/50 hover:border-orange-300"
          }
        `}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${dragActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <UploadCloud className={`w-7 h-7 ${dragActive ? "text-orange-500" : "text-gray-400"}`} />
          </div>
          <p className="text-sm font-semibold text-gray-700">
            <span className="text-orange-600">Tıklayarak seçin</span> veya sürükleyip bırakın
          </p>
          <p className="mt-1 text-xs text-gray-400">PNG, JPG veya GIF • En fazla {maxFiles} görsel</p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Yüklenen Görseller ({previews.length}/{maxFiles})
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm aspect-square bg-gray-100 transition-all hover:shadow-md hover:border-orange-200"
              >
                <img
                  src={buildMediaUrl(preview) || ""}
                  alt={`Önizleme ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 py-1 text-center text-[10px] font-bold text-white flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Ana Görsel
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                  aria-label="Görseli kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {previews.length < maxFiles && (
              <label className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 aspect-square cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50/50">
                <ImagePlus className="w-6 h-6 text-gray-300" />
                <span className="mt-1 text-[10px] font-medium text-gray-400">Ekle</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
