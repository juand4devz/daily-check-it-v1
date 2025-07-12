"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { X, ImageIcon, Loader2, Check, Camera, FileImage } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ThumbnailUploadProps {
    value?: string
    onChange: (url: string | undefined) => void
    disabled?: boolean
}

export function ThumbnailUpload({ value, onChange, disabled = false }: ThumbnailUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const simulateUpload = useCallback(
        async (file: File) => {
            setUploading(true)
            setProgress(0)

            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                setProgress(i)
            }

            // Create object URL for preview (in real app, this would be the uploaded URL)
            const url = URL.createObjectURL(file)
            onChange(url)
            setUploading(false)
            setProgress(0)

            toast.success("Upload berhasil", {
                description: "Thumbnail berhasil diupload",
            })
        },
        [onChange],
    )

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith("image/")) {
                toast.error("File tidak valid", {
                    description: "Hanya file gambar yang diperbolehkan",
                })
                return
            }

            if (file.size > 5 * 1024 * 1024) {
                // 5MB limit
                toast.error("File terlalu besar", {
                    description: "Ukuran file maksimal 5MB",
                })
                return
            }

            await simulateUpload(file)
        },
        [simulateUpload],
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragActive(false)

            if (disabled || uploading) return

            const files = e.dataTransfer.files
            if (files.length > 0) {
                handleFile(files[0])
            }
        },
        [disabled, uploading, handleFile],
    )

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            if (!disabled && !uploading) {
                setDragActive(true)
            }
        },
        [disabled, uploading],
    )

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
    }, [])

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                handleFile(files[0])
            }
            // Reset input
            e.target.value = ""
        },
        [handleFile],
    )

    const removeThumbnail = useCallback(() => {
        if (value) {
            URL.revokeObjectURL(value)
        }
        onChange(undefined)
    }, [value, onChange])

    return (
        <div className="space-y-3">
            <Label>Thumbnail (Opsional)</Label>

            {value ? (
                <Card className="overflow-hidden">
                    <div className="relative">
                        <Image height="500" width="500" src={value || "/placeholder.svg"} alt="Thumbnail preview" className="w-full h-48 object-cover" />

                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    <div className="text-sm">{progress}%</div>
                                    <Progress value={progress} className="w-32 mt-2" />
                                </div>
                            </div>
                        )}

                        {!uploading && (
                            <>
                                <div className="absolute top-2 left-2">
                                    <div className="bg-green-500 text-white rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-8 w-8 p-0"
                                    onClick={removeThumbnail}
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>

                    <CardContent className="p-3">
                        <p className="text-sm text-gray-600">Thumbnail akan ditampilkan sebagai gambar utama post</p>
                    </CardContent>
                </Card>
            ) : (
                <div
                    className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${disabled || uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                >
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <ImageIcon className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>

                        <div>
                            <p className="font-medium text-gray-700">Upload Thumbnail</p>
                            <p className="text-sm text-gray-500 mt-1">Drag & drop atau klik untuk memilih gambar</p>
                            <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF, WebP (Maks. 5MB)</p>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                                disabled={disabled || uploading}
                            >
                                <FileImage className="h-4 w-4 mr-2" />
                                Pilih File
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    cameraInputRef.current?.click()
                                }}
                                disabled={disabled || uploading}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Kamera
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    )
}
