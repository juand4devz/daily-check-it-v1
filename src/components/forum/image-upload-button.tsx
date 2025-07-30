// /components/forum/ImageUploadButton.tsx
"use client";

import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadButtonProps {
    onFilesSelect: (files: File[]) => void; // This will receive the File object(s)
    disabled?: boolean;
    maxSize?: number; // in MB
}

export function ImageUploadButton({ onFilesSelect, disabled = false, maxSize = 5 }: ImageUploadButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        const validFiles: File[] = [];

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) {
                toast.error(`File ${file.name} bukan gambar.`);
                continue;
            }
            if (file.size > maxSize * 1024 * 1024) {
                toast.error(`File ${file.name} terlalu besar (maks ${maxSize}MB).`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            onFilesSelect(validFiles); // Pass the valid files to the parent
        }
        setIsLoading(false);
        event.target.value = ""; // Clear input so same file can be selected again
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                <span className="sr-only">Unggah Gambar</span>
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </>
    );
}