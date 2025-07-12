"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Plus, X, Eye, Send, Loader2, AlertCircle, LinkIcon, Edit, PencilRuler } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Import ScrollArea

import { ThumbnailUpload } from "@/components/forum/thumbnail-upload"
import { MediaUpload } from "@/components/forum/media-upload"
import { MediaViewer } from "@/components/forum/media-viewer"

import {
  FORUM_TYPES,
  FORUM_CATEGORIES,
  typeIcons,
  categoryIcons,
  type ForumType,
  type ForumCategory
} from "@/lib/utils/forum-utils"

// Define the Zod schema for form validation
const formSchema = z.object({
  title: z.string().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(300, "Deskripsi maksimal 300 karakter"),
  content: z.string().min(20, "Konten minimal 20 karakter").max(5000, "Konten maksimal 5000 karakter"),
  type: z.string().min(1, "Tipe diskusi harus dipilih"),
  category: z.string().min(1, "Kategori harus dipilih"),
  tags: z.array(z.string()).max(5, "Maksimal 5 tag dapat ditambahkan").optional(),
  thumbnail: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

interface MediaFile {
  id: string
  file: File
  preview: string // Base64 URL for client-side preview
  type: "image" | "video" | "document"
}

interface DiagnosisData {
  symptoms: string
  diagnosis: string
  timestamp: string
}

export default function NewForumPostPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true) // For initial loading of diagnosis data
  const [newTagInput, setNewTagInput] = useState<string>("") // For new tag input field
  const [activeTab, setActiveTab] = useState<string>("write")

  const router = useRouter()
  // const searchParams = useSearchParams()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      type: "",
      category: "",
      tags: [],
      thumbnail: undefined,
    },
  })

  // State for selected values from Select, to get `selectedType` and `selectedCategory`
  const watchType = form.watch("type")
  const watchCategory = form.watch("category")
  const selectedType = FORUM_TYPES.find((t) => t.id === watchType)
  const selectedCategory = FORUM_CATEGORIES.find((c) => c.id === watchCategory)

  // Load diagnosis data from session storage if available
  useEffect(() => {
    const storedData = sessionStorage.getItem("forumPostData")
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as DiagnosisData
        setDiagnosisData(data)

        // Pre-fill form with diagnosis data
        form.setValue("title", `Bantuan Diagnosa: ${data.diagnosis.split(",")[0].split("(")[0].trim()}`)
        form.setValue(
          "description",
          `Meminta bantuan terkait diagnosa sistem: ${data.diagnosis.split(",")[0].split("(")[0].trim()}`,
        )
        form.setValue(
          "content",
          `Halo semuanya! 👋
Saya baru saja melakukan diagnosa sistem dan mendapatkan hasil berikut:

**Gejala yang Dialami:**
${data.symptoms}

**Hasil Diagnosa:**
${data.diagnosis}

**Waktu Diagnosa:** ${new Date(data.timestamp).toLocaleString("id-ID")}

Apakah ada yang pernah mengalami masalah serupa? Saya ingin meminta saran dan pengalaman dari teman-teman di sini.
Terima kasih! 🙏`,
        )
        form.setValue("type", "pertanyaan") // Default to 'pertanyaan' for diagnosis
        form.setValue("category", "diagnosa") // Default to 'diagnosa' category
        form.setValue("tags", ["diagnosa", "bantuan", "troubleshooting"]) // Default tags
        // Clear the session storage after use
        sessionStorage.removeItem("forumPostData")
      } catch (error) {
        console.error("Error parsing diagnosis data:", error)
      }
    }
    setIsLoading(false)
  }, [form]) // Removed searchParams from dependencies as sessionStorage is primary here

  const handleAddTag = useCallback(() => {
    const currentTags = form.getValues("tags") || []
    if (newTagInput.trim() && !currentTags.includes(newTagInput.trim().toLowerCase()) && currentTags.length < 5) {
      form.setValue("tags", [...currentTags, newTagInput.trim().toLowerCase()], { shouldValidate: true })
      setNewTagInput("")
    } else if (currentTags.length >= 5) {
      toast.error("Batas tag tercapai", {
        description: "Maksimal 5 tag dapat ditambahkan.",
      })
    }
  }, [newTagInput, form])

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = form.getValues("tags") || []
      form.setValue(
        "tags",
        currentTags.filter((tag) => tag !== tagToRemove),
        { shouldValidate: true },
      )
    },
    [form],
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAddTag()
      }
    },
    [handleAddTag],
  )

  const handleMediaUpload = useCallback((files: MediaFile[]) => {
    setMediaFiles((prev) => [...prev, ...files])
  }, [])

  const handleMediaRemove = useCallback((id: string) => {
    setMediaFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  const handleInsertMarkdownLink = useCallback(
    (mediaFile: MediaFile) => {
      const currentContent = form.getValues("content") || ""
      // Use a generic placeholder link for demonstration
      const markdownLink = `![${mediaFile.file.name}](https://example.com/uploads/${mediaFile.id}.${mediaFile.file.name.split(".").pop() || "jpg"})`
      form.setValue("content", currentContent + `\n\n${markdownLink}\n\n`, { shouldValidate: true })
      setActiveTab("write") // Switch to write tab after inserting
      toast.success("Tautan Markdown disisipkan", {
        description: "Tautan gambar telah ditambahkan ke konten diskusi.",
      })
    },
    [form],
  )

  const onSubmit = async (values: FormSchema) => {
    setIsSubmitting(true)
    try {
      // Prepare media data for API (convert to base64)
      const mediaData = await Promise.all(
        mediaFiles.map(async (media) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(media.file)
          })
          return {
            id: media.id,
            type: media.type,
            filename: media.file.name,
            size: media.file.size,
            data: base64,
          }
        }),
      )

      const postData = {
        title: values.title,
        description: values.description,
        content: values.content,
        type: values.type,
        category: values.category,
        tags: values.tags || [],
        thumbnail: values.thumbnail,
        media: mediaData,
        author: "Current User", // In real app, get from auth
        avatar: "/placeholder.svg?height=40&width=40", // Default avatar
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: 0,
        views: 0,
        isResolved: false,
        isPinned: false,
      }

      // Simulate API call
      // const response = await fetch("/api/forum/posts", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(postData),
      // })
      // if (!response.ok) {
      //   const errorData = await response.json()
      //   throw new Error(errorData.error || "Gagal membuat post")
      // }
      // const result = await response.json()

      // For simulation without backend API, save to localStorage
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay
      const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
      const newPostWithId = { id: Date.now().toString(), ...postData } // Add unique ID
      localStorage.setItem("forumPosts", JSON.stringify([newPostWithId, ...existingPosts]))

      toast.error("Diskusi berhasil dibuat", {
        description: "Diskusi Anda telah dipublikasikan",
      })
      router.push(`/forum/${newPostWithId.id}`) // Redirect to the newly created post
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Gagal membuat diskusi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan diskusi",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-48" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 mw-full">
      {/* Header */}
      <div className="flex-col items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="mt-4 flex items-center">
          <PencilRuler className="h-14 w-14 mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Buat Diskusi Baru</h1>
            <p className="text-gray-600">Bagikan pertanyaan, pengetahuan, atau pengalaman Anda</p>
          </div>
        </div>
      </div>

      {diagnosisData && (
        <Alert variant="default" className="mt-5 mb-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Data Diagnosa Terdeteksi</AlertTitle>
          <AlertDescription>
            Form telah diisi otomatis berdasarkan hasil diagnosa Anda. Silakan edit sesuai kebutuhan.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="title">Judul Diskusi *</FormLabel>
                        <FormControl>
                          <Input
                            id="title"
                            placeholder="Tulis judul yang jelas dan deskriptif..."
                            maxLength={200}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/200 karakter</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="description">Deskripsi Singkat *</FormLabel>
                        <FormControl>
                          <Textarea
                            id="description"
                            placeholder="Berikan deskripsi singkat tentang diskusi Anda (maks 300 karakter)..."
                            maxLength={300}
                            rows={3}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-gray-500 mt-0">{field.value?.length || 0}/300 karakter</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Type and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-3 col-span-1">
                          <FormLabel htmlFor="type">Tipe Diskusi *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih tipe diskusi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FORUM_TYPES.map((forumType: ForumType) => {
                                const TypeIcon = typeIcons[forumType.icon as keyof typeof typeIcons] || Plus // Default icon
                                return (
                                  <SelectItem key={forumType.id} value={forumType.id}>
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className="h-4 w-4" />
                                      <div className="text-left">
                                        <div className="font-medium">{forumType.name}</div>
                                        <div className="text-[10px] text-gray-500">{forumType.description}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="space-y-3 col-span-1">
                          <FormLabel htmlFor="category">Kategori *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FORUM_CATEGORIES.map((cat: ForumCategory) => {
                                const CategoryIcon = categoryIcons[cat.id as keyof typeof categoryIcons] || Plus // Default icon
                                return (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <div className="flex items-center gap-2">
                                      <CategoryIcon className="h-4 w-4" />
                                      <span>{cat.name}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Tags - only show if type allows tags */}
                  {selectedType?.allowTags && (
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Tag (Opsional)</FormLabel>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Tekan Enter untuk menambah tag..."
                                maxLength={20}
                                disabled={isSubmitting}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddTag}
                                disabled={!newTagInput.trim() || (field.value?.length || 0) >= 5 || isSubmitting}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {field.value.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="gap-1">
                                    #{tag}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-3 w-3 p-0 hover:bg-transparent"
                                      onClick={() => handleRemoveTag(tag)}
                                      disabled={isSubmitting}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Maksimal 5 tag, gunakan tag yang relevan untuk memudahkan pencarian
                            </div>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ThumbnailUpload value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Konten Diskusi *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="absolute top-0 right-0">
                      <TabsTrigger value="write">
                        <Edit className="h-4 w-4 mr-2" />
                        Tulis</TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Tulis konten diskusi Anda di sini... Anda dapat menggunakan Markdown untuk formatting."
                                className="min-h-[300px] resize-none"
                                maxLength={5000}
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Mendukung Markdown formatting</span>
                              <span>{field.value?.length || 0}/5000</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Media Upload */}
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Upload Media (Opsional)</h4>
                        <MediaUpload onUpload={handleMediaUpload} disabled={isSubmitting} />
                        {mediaFiles.length > 0 && (
                          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <div className="flex w-max space-x-4 p-4">
                              {mediaFiles.map((media) => (
                                <div key={media.id} className="relative group w-[150px] h-[150px] flex-shrink-0">
                                  <MediaViewer
                                    media={[
                                      { type: media.type === "document" ? "image" : media.type, url: media.preview },
                                    ]}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleMediaRemove(media.id)}
                                    disabled={isSubmitting}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="absolute bottom-2 left-1/2 -translate-x-1/2 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    onClick={() => handleInsertMarkdownLink(media)}
                                    disabled={isSubmitting}
                                  >
                                    <LinkIcon className="h-3 w-3 mr-1" /> Sisipkan Link
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="min-h-[300px] p-4 border rounded-lg bg-gray-50 dark:bg-neutral-800">
                        {form.watch("content") ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.watch("content")}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Tidak ada konten untuk di-preview</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-8 h-fit">
              {" "}
              {/* Added sticky and top-8 */}
              {/* Type Info */}
              {selectedType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {(() => {
                        const TypeIcon = typeIcons[selectedType.icon as keyof typeof typeIcons] || Plus // Default icon
                        return <TypeIcon className="h-5 w-5" />
                      })()}
                      {selectedType.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{selectedType.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Solusi dapat ditandai:</span>
                        <Badge variant={selectedType.allowSolution ? "default" : "secondary"}>
                          {selectedType.allowSolution ? "Ya" : "Tidak"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tag dapat digunakan:</span>
                        <Badge variant={selectedType.allowTags ? "default" : "secondary"}>
                          {selectedType.allowTags ? "Ya" : "Tidak"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Category Info */}
              {selectedCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {(() => {
                        const CategoryIcon = categoryIcons[selectedCategory.id as keyof typeof categoryIcons] || Plus // Default icon
                        return <CategoryIcon className="h-5 w-5" />
                      })()}
                      {selectedCategory.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ">{selectedCategory.description}</p>
                  </CardContent>
                </Card>
              )}
              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Panduan Posting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Tips untuk diskusi yang baik:</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Gunakan judul yang jelas dan deskriptif</li>
                      <li>Berikan konteks yang cukup dalam konten</li>
                      <li>Gunakan tag yang relevan</li>
                      <li>Sertakan screenshot jika diperlukan</li>
                      <li>Bersikap sopan dan konstruktif</li>
                    </ul>
                  </div>

                  {selectedType?.id === "pertanyaan" && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Khusus untuk pertanyaan:</h4>
                      <ul className="space-y-1 text-gray-600 list-disc list-inside">
                        <li>Jelaskan masalah dengan detail</li>
                        <li>Sebutkan apa yang sudah dicoba</li>
                        <li>Sertakan spesifikasi sistem jika relevan</li>
                        <li>Tandai jawaban terbaik sebagai solusi</li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Submit Button */}
              <Card>
                <CardContent className="p-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting} // Form validation is handled automatically by react-hook-form
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memposting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publikasikan Diskusi
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Dengan mempublikasikan, Anda menyetujui aturan komunitas
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
