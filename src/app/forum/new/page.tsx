"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowLeft, Send, Eye, X, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { MediaUpload } from "@/components/forum/media-upload"
import { MediaViewer } from "@/components/forum/media-viewer"
import forumCategoriesData from "@/data/forum-categories.json"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  title: z.string().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),
  content: z.string().min(20, "Konten minimal 20 karakter").max(5000, "Konten maksimal 5000 karakter"),
  category: z.string().min(1, "Kategori harus dipilih"),
  tags: z.string().optional(),
})

interface MediaFile {
  id: string
  file: File
  preview: string
  type: "image" | "video" | "document"
}

interface DiagnosisData {
  symptoms: string
  diagnosis: string
  timestamp: string
}

export default function NewForumPostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: "",
    },
  })

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
        form.setValue("category", "troubleshooting")
        form.setValue("tags", "diagnosa, bantuan, troubleshooting")

        // Clear the session storage
        sessionStorage.removeItem("forumPostData")
      } catch (error) {
        console.error("Error parsing diagnosis data:", error)
      }
    }
    setIsLoading(false)
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      // Prepare media data
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
        ...values,
        tags:
          values.tags
            ?.split(",")
            .map((tag) => tag.trim())
            .filter(Boolean) || [],
        media: mediaData,
        author: "Anonymous User", // In real app, get from auth
        timestamp: new Date().toISOString(),
      }

      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal membuat post")
      }

      const result = await response.json()

      toast.success("Post berhasil dibuat!")
      router.push(`/forum/${result.id}`)
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error(error instanceof Error ? error.message : "Gagal membuat post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaUpload = (files: MediaFile[]) => {
    setMediaFiles((prev) => [...prev, ...files])
  }

  const handleMediaRemove = (id: string) => {
    setMediaFiles((prev) => prev.filter((file) => file.id !== id))
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
    <div className="container mx-auto px-4 py-8 w-full">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <h1 className="text-3xl font-bold mb-2">Buat Post Baru</h1>
        <p className="text-gray-600">Bagikan pertanyaan, pengalaman, atau diskusi dengan komunitas</p>

        {diagnosisData && (
          <Alert variant="default" className="mt-5">
            <AlertCircle className="h-14 w-14" />
            <AlertTitle>Data Diagnosa Terdeteksi</AlertTitle>
            <AlertDescription>
              Form telah diisi otomatis berdasarkan hasil diagnosa Anda. Silakan edit sesuai kebutuhan.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Post</CardTitle>
              <CardDescription>Isi informasi dasar untuk post Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Post *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan judul yang menarik dan deskriptif..."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori post" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {forumCategoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pisahkan dengan koma, contoh: hardware, software, troubleshooting"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Konten Post</CardTitle>
              <CardDescription>Tulis konten post Anda dengan detail</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="write" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="write">Tulis</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
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
                            placeholder="Tulis konten post Anda di sini... Anda bisa menggunakan Markdown untuk formatting."
                            className="min-h-[300px] resize-none"
                            {...field}
                            disabled={isSubmitting}
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
                  <div className="space-y-4">
                    <Label>Media (Opsional)</Label>
                    <MediaUpload onUpload={handleMediaUpload} disabled={isSubmitting} />

                    {mediaFiles.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mediaFiles.map((media) => (
                          <div key={media.id} className="relative group">
                            <MediaViewer file={media} />
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
                          </div>
                        ))}
                      </div>
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

          <Card>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memposting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Posting
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
