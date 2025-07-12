"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ImageIcon, Loader2, Copy, Check, Camera, FileImage } from "lucide-react"
import { toast } from "sonner"
import { MAX_IMAGE_SIZE, MAX_MEDIA_FILES } from "@/lib/utils/forum-utils"
import Image from "next/image"

interface UploadedImage {
    id: string
    file: File
    url: string
    progress: number
    uploaded: boolean
    name: string
    size: number
}

interface ImageUploadProps {
    onImageInsert?: (imageUrl: string) => void
    maxImages?: number
    disabled?: boolean
}

export function ImageUpload({ onImageInsert, maxImages = MAX_MEDIA_FILES, disabled = false }: ImageUploadProps) {
    const [images, setImages] = useState<UploadedImage[]>([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const simulateUpload = useCallback(async (image: UploadedImage) => {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, progress } : img)))
        }

        // Mark as uploaded
        setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, uploaded: true } : img)))

        toast.success("Upload berhasil", {
            description: `${image.name} berhasil diupload`,
        })
    }, [])

    const handleFiles = useCallback(
        async (files: FileList) => {
            const fileArray = Array.from(files)
            const imageFiles = fileArray.filter((file) => file.type.startsWith("image/"))

            if (imageFiles.length === 0) {
                toast.error("File tidak valid", {
                    description: "Hanya file gambar yang diperbolehkan",
                })
                return
            }

            const validImages: File[] = []
            for (const file of imageFiles) {
                if (file.size > MAX_IMAGE_SIZE) {
                    toast.error("Gambar terlalu besar", {
                        description: `${file.name} melebihi batas ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
                    })
                } else {
                    validImages.push(file)
                }
            }

            if (images.length + validImages.length > maxImages) {
                toast.error("Batas maksimal tercapai", {
                    description: `Maksimal ${maxImages} gambar yang dapat diupload`,
                })
                return
            }

            const newImages: UploadedImage[] = validImages.map((file) => ({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                url: URL.createObjectURL(file),
                progress: 0,
                uploaded: false,
                name: file.name,
                size: file.size,
            }))

            setImages((prev) => [...prev, ...newImages])

            // Start upload simulation for each image
            newImages.forEach((image) => {
                simulateUpload(image)
            })
        },
        [images.length, maxImages, simulateUpload],
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragActive(false)

            if (disabled) return

            const files = e.dataTransfer.files
            if (files.length > 0) {
                handleFiles(files)
            }
        },
        [disabled, handleFiles],
    )

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            if (!disabled) {
                setDragActive(true)
            }
        },
        [disabled],
    )

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
    }, [])

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                handleFiles(files)
            }
            // Reset input
            e.target.value = ""
        },
        [handleFiles],
    )

    const removeImage = useCallback((id: string) => {
        setImages((prev) => {
            const imageToRemove = prev.find((img) => img.id === id)
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.url)
            }
            return prev.filter((img) => img.id !== id)
        })
    }, [])

    const insertImageToEditor = useCallback(
        async (imageUrl: string, imageName: string) => {
            if (onImageInsert) {
                const markdown = `![${imageName}](${imageUrl})`
                onImageInsert(markdown)
                toast("Gambar disisipkan", {
                    description: "Markdown gambar telah disalin ke editor",
                })
            } else {
                // Fallback to copying URL if no onImageInsert handler
                await navigator.clipboard.writeText(imageUrl)
                toast("Link disalin", {
                    description: "Link gambar telah disalin ke clipboard",
                })
            }
        },
        [onImageInsert],
    )

    const copyImageUrl = useCallback(async (imageUrl: string) => {
        try {
            await navigator.clipboard.writeText(imageUrl)
            toast("Link disalin", {
                description: "Link gambar telah disalin ke clipboard",
            })
        } catch (error) {
            console.error(error)
            toast.error("Gagal menyalin", {
                description: "Tidak dapat menyalin link gambar",
            })
        }
    }, [])

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${disabled || images.length >= maxImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && images.length < maxImages && fileInputRef.current?.click()}
            >
                <div className="space-y-3">
                    <div className="flex justify-center">
                        <div className="p-3 bg-gray-100 rounded-full">
                            <ImageIcon className="h-8 w-8 text-gray-600" />
                        </div>
                    </div>

                    <div>
                        <p className="text-lg font-medium text-gray-700">Upload Gambar</p>
                        <p className="text-sm text-gray-500 mt-1">Drag & drop atau klik untuk memilih gambar</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Maksimal {maxImages} gambar, ukuran max {MAX_IMAGE_SIZE / 1024 / 1024}MB per gambar. Format: JPG, PNG,
                            GIF, WebP
                        </p>
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
                            disabled={disabled || images.length >= maxImages}
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
                            disabled={disabled || images.length >= maxImages}
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            Kamera
                        </Button>
                    </div>
                </div>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                            Gambar yang diupload ({images.length}/{maxImages})
                        </h4>
                        <Badge variant="outline" className="text-xs">
                            {images.filter((img) => img.uploaded).length} selesai
                        </Badge>
                    </div>

                    <ScrollArea className="w-full">
                        <div className="flex gap-3 pb-2">
                            {images.map((image) => (
                                <Card key={image.id} className="flex-shrink-0 w-48 overflow-hidden">
                                    <div className="relative">
                                        <Image height="500" width="500" src={image.url || "/placeholder.svg"} alt={image.name} className="w-full h-32 object-cover" />

                                        {/* Remove button */}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 h-6 w-6 p-0"
                                            onClick={() => removeImage(image.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>

                                        {/* Upload progress overlay */}
                                        {!image.uploaded && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                    <div className="text-xs">{image.progress}%</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Success overlay */}
                                        {image.uploaded && (
                                            <div className="absolute top-2 left-2">
                                                <div className="bg-green-500 text-white rounded-full p-1">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <CardContent className="p-3">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium truncate" title={image.name}>
                                                    {image.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                                            </div>

                                            {/* Progress bar */}
                                            {!image.uploaded && <Progress value={image.progress} className="h-1" />}

                                            {/* Action buttons */}
                                            {image.uploaded && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-7 text-xs bg-transparent"
                                                        onClick={() => insertImageToEditor(image.url, image.name)}
                                                    >
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Sisipkan (Markdown)
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 bg-transparent"
                                                        onClick={() => copyImageUrl(image.url)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileInput} className="hidden" />

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
