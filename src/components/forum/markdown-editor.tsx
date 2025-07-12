"use client"

import type React from "react"
import { useState, useCallback } from "react" // Added useRef
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { X, Link } from "lucide-react" // Renamed Image to ImageIcon
import { ImageUploadButton } from "./image-upload-button"
import { toast } from "sonner"
import Image from "next/image"

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    onMediaFilesChange?: (files: File[]) => void
    placeholder?: string
    rows?: number
    disabled?: boolean
    showMediaInput?: boolean
    mediaPreviews?: { url: string; filename: string }[]
    className?: string
    textareaRef?: React.RefObject<HTMLTextAreaElement>
}

export function MarkdownEditor({
    value,
    onChange,
    onMediaFilesChange,
    placeholder = "Tulis di sini...",
    rows = 4,
    disabled = false,
    showMediaInput = true,
    mediaPreviews = [],
    className,
    textareaRef,
}: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState("write")

    const handlePaste = useCallback(
        (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const items = event.clipboardData?.items
            if (items) {
                for (const item of Array.from(items)) {
                    if (item.type.startsWith("image/") && onMediaFilesChange) {
                        const file = item.getAsFile()
                        if (file) {
                            onMediaFilesChange([file])
                            toast.info(`Gambar ${file.name} ditempelkan!`)
                            event.preventDefault()
                        }
                    }
                }
            }
        },
        [onMediaFilesChange],
    )

    const handleImageUpload = useCallback(
        (files: File[]) => {
            if (onMediaFilesChange) {
                onMediaFilesChange(files)
            }
        },
        [onMediaFilesChange],
    )

    const handleRemoveMedia = useCallback(
        (indexToRemove: number) => {
            if (onMediaFilesChange) {
                // Assuming mediaPreviews only contains one item for simplicity.
                // If it can contain multiple, this logic needs adjustment.
                onMediaFilesChange([]) // Clear all media
                toast.info("Gambar dihapus.")
            }
        },
        [onMediaFilesChange],
    )

    const handleInsertImageLink = useCallback(() => {
        const markdownLink = "![Deskripsi Gambar](https://example.com/your-image.jpg)\n"
        const currentCursorPosition = textareaRef?.current?.selectionStart || value.length
        const newValue = value.substring(0, currentCursorPosition) + markdownLink + value.substring(currentCursorPosition)
        onChange(newValue)

        // Optional: Focus and set cursor after insertion
        setTimeout(() => {
            if (textareaRef?.current) {
                const newCursorPosition = currentCursorPosition + markdownLink.length
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
            }
        }, 0)

        toast.info("Markdown link gambar ditambahkan.")
    }, [value, onChange, textareaRef])

    return (
        <div
            className={`
      relative border rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-900
      ${className || ""}
    `}
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="flex items-center justify-between border-b p-2 flex-shrink-0">
                    <TabsList className="grid w-fit grid-cols-2 h-8">
                        <TabsTrigger value="write" className="h-6 text-xs">
                            Tulis
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="h-6 text-xs">
                            Review
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        {showMediaInput && (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleInsertImageLink}
                                    disabled={disabled}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                    title="Masukkan link gambar Markdown"
                                >
                                    <Link className="h-4 w-4" />
                                    <span className="sr-only">Masukkan link gambar Markdown</span>
                                </Button>
                                <ImageUploadButton onFilesSelect={handleImageUpload} disabled={disabled} />
                            </>
                        )}
                    </div>
                </div>

                <TabsContent value="write" className="p-4 mt-0 border-none flex-grow">
                    <Textarea
                        ref={textareaRef}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={rows}
                        className="resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-full min-h-[100px]"
                        disabled={disabled}
                        onPaste={handlePaste}
                    />
                </TabsContent>

                <TabsContent value="preview" className="p-4 mt-0 border-none flex-grow">
                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto max-h-[400px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "_Tidak ada konten untuk direview_"}</ReactMarkdown>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Moved media previews outside of tabs content */}
            {mediaPreviews && mediaPreviews.length > 0 && (
                <div className="border-t p-4">
                    <p className="text-sm font-medium mb-2">Media Terlampir:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {mediaPreviews.map((media, index) => (
                            <div key={index} className="relative aspect-video rounded-md overflow-hidden border">
                                <Image
                                    src={media.url || "/placeholder.svg"}
                                    alt={`Preview ${media.filename}`}
                                    layout="fill"
                                    objectFit="cover"
                                />
                                {!disabled && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                                        onClick={() => handleRemoveMedia(index)}
                                        disabled={disabled}
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Hapus gambar</span>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
