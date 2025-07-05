"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface MediaFile {
  id: string
  file: File
  preview: string
  type: "image" | "video" | "document"
}

interface MediaUploadProps {
  onUpload: (files: MediaFile[]) => void
  disabled?: boolean
  maxFiles?: number
  maxSize?: number // in MB
}

export function MediaUpload({ onUpload, disabled = false, maxFiles = 5, maxSize = 10 }: MediaUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): "image" | "video" | "document" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    return "document"
  }

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve("/placeholder.svg?height=100&width=100")
      }
    })
  }

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsProcessing(true)

    try {
      const validFiles: MediaFile[] = []
      const fileArray = Array.from(files)

      // Validate files
      for (const file of fileArray) {
        if (validFiles.length >= maxFiles) {
          toast.error(`Maksimal ${maxFiles} file yang dapat diupload`)
          break
        }

        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`File ${file.name} terlalu besar. Maksimal ${maxSize}MB`)
          continue
        }

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "video/mp4",
          "video/webm",
          "application/pdf",
          "text/plain",
        ]

        if (!allowedTypes.includes(file.type)) {
          toast.error(`Tipe file ${file.name} tidak didukung`)
          continue
        }

        const preview = await createPreview(file)
        const mediaFile: MediaFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          type: getFileType(file),
        }

        validFiles.push(mediaFile)
      }

      if (validFiles.length > 0) {
        onUpload(validFiles)
        toast.success(`${validFiles.length} file berhasil diupload`)
      }
    } catch (error) {
      console.error("Error processing files:", error)
      toast.error("Gagal memproses file")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files)
    // Reset input value so same file can be selected again
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled || isProcessing) return
    processFiles(event.dataTransfer.files)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled || isProcessing
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memproses file...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium">Klik untuk upload atau drag & drop</p>
              <p className="text-xs text-gray-500">
                Gambar, video, atau dokumen (maks {maxSize}MB per file, {maxFiles} file)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          <Camera className="h-4 w-4 mr-2" />
          Ambil Foto
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
