"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Camera, Info, Loader2, X, AlertTriangle, Sparkles, Copy, Check, Shuffle, BrushCleaning, Crown, ImageUp, Brain } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { useSession } from "next-auth/react"
import type { UserTokenData } from "@/types/types"
// Import library untuk kompresi gambar
import imageCompression from "browser-image-compression"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    image?: string
    model?: string
}

const formSchema = z.object({
    message: z.string().max(400, "Pesan maksimal 400 karakter").optional(),
})

const ALL_EXAMPLE_QUESTIONS = [
    "Apa kemungkinan penyebab laptop tidak bisa menyala sama sekali?",
    "Apa penyebab utama baterai laptop cepat habis?",
    "Bagaimana cara mengatasi komputer yang sering restart sendiri?",
    "Komputer saya lambat, apa yang harus saya lakukan?",
    "Layar laptop saya bergaris, bagaimana mengatasinya?",
    "Kenapa komputer saya sering blue screen?",
    "Bagaimana cara mengatasi laptop yang overheat?",
    "Suara kipas laptop sangat berisik, apa penyebabnya?",
    "Komputer tidak bisa connect ke WiFi, bagaimana solusinya?",
    "Hard disk saya berbunyi aneh, apakah berbahaya?",
    "RAM laptop saya penuh terus, bagaimana mengatasinya?",
    "Keyboard laptop beberapa tombol tidak berfungsi, kenapa?",
    "Touchpad laptop tidak responsif, apa solusinya?",
    "Komputer saya sering hang saat bermain game, kenapa?",
    "Bagaimana cara membersihkan virus dari komputer?",
    "SSD atau HDD yang lebih baik untuk laptop lama?",
    "Komputer tidak bisa booting, stuck di logo, kenapa?",
    "Layar laptop redup meski brightness sudah maksimal, kenapa?",
    "Port USB laptop tidak berfungsi, bagaimana memperbaikinya?",
    "Komputer sering mati mendadak tanpa peringatan, kenapa?",
    "Bagaimana cara upgrade RAM laptop yang aman?",
    "Webcam laptop tidak terdeteksi, apa penyebabnya?",
    "Audio laptop tidak keluar suara, bagaimana mengatasinya?",
]

const DEFAULT_IMAGE_PROMPT =
    "Analisa gambar ini dan berikan penjelasan detail tentang apa yang terlihat, terutama jika berkaitan dengan teknologi komputer atau perangkat elektronik. Identifikasi komponen, masalah, atau hal menarik yang dapat dilihat dari gambar."

const getRandomQuestions = (): string[] => {
    const shuffled = [...ALL_EXAMPLE_QUESTIONS].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
}

const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
            return true
        } else {
            const textArea = document.createElement("textarea")
            textArea.value = text
            textArea.style.position = "fixed"
            textArea.style.left = "-999999px"
            textArea.style.top = "-999999px"
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            const result = document.execCommand("copy")
            textArea.remove()
            return result
        }
    } catch (error) {
        console.error("Failed to copy text:", error)
        return false
    }
}

const CopyButton: React.FC<{ content: string; className?: string }> = ({ content, className = "" }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const success = await copyToClipboard(content)

        if (success) {
            setCopied(true)
            toast.success("Berhasil menyalin pesan!", {
                duration: 2000,
            })
            setTimeout(() => setCopied(false), 2000)
        } else {
            toast.error("Gagal menyalin pesan. Silakan coba lagi.", {
                duration: 3000,
            })
        }
    }

    return (
        <Button
            asChild
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`cursor-pointer h-7 w-7 p-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 ${className}`}
            title={copied ? "Berhasil disalin!" : "Salin pesan"}
        >
            {copied ? (
                <Check className="h-4 w-4 text-green-600" />
            ) : (
                <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            )}
        </Button>
    )
}

export default function AIChatPage() {
    const { data: session, status } = useSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isProcessingImage, setIsProcessingImage] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [showOfflineWarning, setShowOfflineWarning] = useState(false)
    const [exampleQuestions, setExampleQuestions] = useState<string[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [userTokenData, setUserTokenData] = useState<UserTokenData | null>(null)
    const [isFetchingTokens, setIsFetchingTokens] = useState(true)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
        },
    })

    useEffect(() => {
        setExampleQuestions(getRandomQuestions())
    }, [])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(
                window.innerWidth <= 768 ||
                /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            )
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Load chat history from localStorage on component mount
    useEffect(() => {
        const savedMessages = localStorage.getItem("ai-chat-history")
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages).map((msg: Message) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }))
                setMessages(parsedMessages)
            } catch (error) {
                console.error("Error loading chat history:", error)
                localStorage.removeItem("ai-chat-history")
            }
        }
    }, [])

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("ai-chat-history", JSON.stringify(messages))
        }
    }, [messages])

    const fetchUserTokens = useCallback(async () => {
        if (status === "loading") {
            setIsFetchingTokens(true);
            return;
        }

        if (!session || !session.user || !session.user.id) {
            setUserTokenData(null);
            setIsFetchingTokens(false);
            setShowOfflineWarning(true);
            toast.warning("Anda harus login untuk menggunakan fitur AI ini.");
            return;
        }

        setIsFetchingTokens(true);
        try {
            const response = await fetch("/api/user-tokens");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Gagal memuat data token.");
            }
            const fetchedTokenData: UserTokenData = await response.json();
            setUserTokenData(fetchedTokenData);
            setShowOfflineWarning(false);
        } catch (err) {
            console.error("Error fetching user tokens:", err);
            setShowOfflineWarning(true);
            setUserTokenData(null);
            toast.error("Gagal memuat data token. Fitur AI mungkin terbatas.");
        } finally {
            setIsFetchingTokens(false);
        }
    }, [session, status]);

    useEffect(() => {
        fetchUserTokens();
    }, [fetchUserTokens]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (values: z.infer<typeof formSchema>) => {
        const messageContent = values.message?.trim() || ""
        const finalMessage = selectedImage && !messageContent ? DEFAULT_IMAGE_PROMPT : messageContent

        if (!finalMessage && !selectedImage) return

        if (!session?.user?.id) {
            toast.error("Anda harus login untuk menggunakan fitur AI ini.");
            return;
        }

        if (!userTokenData || userTokenData.dailyTokens <= 0) {
            toast.error("Token harian Anda sudah habis! Token akan direset jam 7 pagi WIB.");
            return;
        }

        setIsLoading(true)
        setShowOfflineWarning(false)

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: finalMessage,
            timestamp: new Date(),
            image: selectedImage || undefined,
        }

        setMessages((prev) => [...prev, userMessage])
        form.reset()
        setSelectedImage(null)

        try {
            const decrementResponse = await fetch("/api/user-tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "decrement", tokensUsed: 1 }),
            });

            if (!decrementResponse.ok) {
                const errorData = await decrementResponse.json();
                setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
                toast.error(errorData.message || "Gagal mengurangi token. Pesan tidak terkirim.");
                setUserTokenData(prev => prev ? {
                    ...prev,
                    dailyTokens: prev.dailyTokens + 1,
                    totalUsage: Math.max(0, prev.totalUsage - 1),
                } : null);
                setIsLoading(false);
                return;
            }
            const updatedTokenResult: UserTokenData = await decrementResponse.json();
            setUserTokenData(prev => prev ? {
                ...prev,
                dailyTokens: updatedTokenResult.dailyTokens,
                totalUsage: updatedTokenResult.totalUsage,
                lastResetDate: updatedTokenResult.lastResetDate,
            } : null);

            const conversationHistory = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
                image: msg.image,
            }))

            const response = await fetch("/api/ai-assistance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: finalMessage,
                    image: selectedImage,
                    history: conversationHistory,
                    context: "chat",
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                setShowOfflineWarning(true)
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error("No response body")

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])

            const decoder = new TextDecoder()
            let done = false
            let currentModel = "";

            while (!done) {
                const { value, done: readerDone } = await reader.read()
                done = readerDone

                if (value) {
                    const chunk = decoder.decode(value)
                    const lines = chunk.split("\n")

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6)
                            if (data === "[DONE]") {
                                done = true
                                break
                            }

                            try {
                                const parsed = JSON.parse(data)
                                if (parsed.content) {
                                    setMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                                        ),
                                    )
                                }
                                if (parsed.model) {
                                    currentModel = parsed.model;
                                    setMessages((prev) =>
                                        prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, model: parsed.model } : msg)),
                                    )
                                }
                                if (parsed.error) {
                                    throw new Error(parsed.error)
                                }
                            } catch (e) {
                                console.warn("Chunk parsing warning:", e)
                            }
                        }
                    }
                }
            }
            if (currentModel && currentModel !== "offline") {
                const isGeminiPro = currentModel.includes("gemini-2.5-pro");
                if (isGeminiPro) {
                    toast.success(`✨ Respon AI berhasil dimuat menggunakan Gemini Pro 2.5 (Model Utama)`);
                } else {
                    toast.success(`Respon AI berhasil dimuat menggunakan ${currentModel} (Fallback)`);
                }
            } else if (currentModel === "offline") {
                toast.success("Respon berhasil dimuat (Mode Offline)");
            } else {
                toast.success("Respon AI berhasil dimuat");
            }

            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.id === assistantMessage.id && msg.content.trim() === "") {
                        return {
                            ...msg,
                            content:
                                "Maaf, terjadi kesalahan dalam memproses response. Silakan coba lagi dengan pertanyaan yang lebih spesifik.",
                            model: "offline"
                        }
                    }
                    return msg
                }),
            )
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui"

            setShowOfflineWarning(true)
            toast.error(errorMessage)

            setUserTokenData(prev => prev ? {
                ...prev,
                dailyTokens: prev.dailyTokens + 1,
                totalUsage: Math.max(0, prev.totalUsage - 1),
            } : null);

            setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === "assistant" && lastMessage.id === (Date.now() + 1).toString()) {
                    return prev.map(msg => msg.id === lastMessage.id ? {
                        ...msg,
                        content: `Maaf, ada masalah saat mendapatkan respons dari AI. Coba lagi atau pastikan Anda online. Detail: ${errorMessage}.`,
                        model: "offline"
                    } : msg);
                } else {
                    return [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: `Maaf, ada masalah saat mendapatkan respons dari AI. Coba lagi atau pastikan Anda online. Detail: ${errorMessage}.`,
                        timestamp: new Date(),
                        model: "offline"
                    }];
                }
            });
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        event.target.value = ""

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file terlalu besar. Maksimal 5MB.")
            return
        }

        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar.")
            return
        }

        setIsProcessingImage(true)

        try {
            // Mengompres gambar sebelum diunggah
            const options = {
                maxSizeMB: 1,           // Ukuran maksimum 1MB
                maxWidthOrHeight: 1920, // Dimensi maksimum 1920px
                useWebWorker: true,     // Menggunakan Web Worker untuk performa yang lebih baik
            }
            const compressedFile = await imageCompression(file, options)

            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setSelectedImage(result)
                toast.success("Gambar berhasil diunggah")
                setIsProcessingImage(false)
                form.setValue("message", "");
                textareaRef.current?.focus();
            }
            reader.onerror = () => {
                toast.error("Gagal membaca file gambar")
                setIsProcessingImage(false)
            }
            reader.readAsDataURL(compressedFile)
        } catch (error) {
            console.error("Error processing image:", error)
            toast.error("Gagal memproses gambar. Silakan coba lagi.")
            setIsProcessingImage(false)
        }
    }

    const handleClearChat = () => {
        toast("Hapus riwayat chat?", {
            description: "Semua percakapan akan dihapus tanpa bisa dipulihkan.",
            action: {
                label: "Hapus",
                onClick: () => {
                    setMessages([])
                    form.reset()
                    setSelectedImage(null)
                    setShowOfflineWarning(false)
                    localStorage.removeItem("ai-chat-history")
                    setExampleQuestions(getRandomQuestions())
                    toast.success("Chat berhasil dibersihkan")
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => {
                },
            },
        })
    }

    const handleExampleClick = (question: string) => {
        form.setValue("message", question)
        textareaRef.current?.focus()
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            form.handleSubmit(handleSendMessage)()
        }
    }

    const getModelBadgeInfo = (model: string) => {
        if (model.includes("gemini-2.5-pro")) {
            return { variant: "default" as const, icon: Crown, color: "text-yellow-600" };
        } else if (model.includes("gemini")) {
            return { variant: "secondary" as const, icon: Sparkles, color: "text-blue-600" };
        } else if (model.includes("offline")) {
            return { variant: "outline" as const, icon: AlertTriangle, color: "text-gray-600" };
        } else {
            return { variant: "outline" as const, icon: Sparkles, color: "text-green-600" };
        }
    };

    const isDisabled = isLoading || isProcessingImage || !session?.user?.id || (userTokenData?.dailyTokens ?? 0) <= 0 || isFetchingTokens;

    return (
        <Card className="flex-1 flex flex-col min-h-0 rounded-none bg-background px-6 lg:px-36 xl:px-60 2xl:px-72 border-0">
            {showOfflineWarning && (
                <Alert className="mb-6 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <strong>Mode Offline:</strong> Layanan AI sedang tidak tersedia atau Anda belum login. Namun, sistem tetap dapat memberikan bantuan
                        troubleshooting dasar berdasarkan pengetahuan yang tersimpan. Fitur analisis gambar mungkin terbatas.
                    </AlertDescription>
                </Alert>
            )}

            <div className=" flex flex-col">
                <div className="relative mt-5">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="space-y-2 mb-8">
                                <p className="font-semibold text-sm flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-blue-600" />
                                    Hai! Saya Asisten Teknisi AI
                                </p>
                                <p className="text-sm">
                                    Saya dapat membantu Anda dengan masalah komputer, laptop, dan perangkat teknologi lainnya.
                                    {showOfflineWarning
                                        ? " Saat ini dalam mode offline dengan bantuan dasar."
                                        : " Saya juga bisa menganalisis gambar perangkat Anda."}
                                </p>
                            </div>
                        </div>
                    </div >
                </div >

                {messages.length === 0 && (
                    <div className="pb-10">
                        <div className="flex items-center justify-between mb-2 mt-8 md:mt-8">
                            <h3 className="text-xs font-semibold">CONTOH PERTANYAAN</h3>
                            <div className="flex gap-x-3">
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="gap-2 flex-shrink-0 bg-transparent">
                                            <Info className="h-4 w-4" />
                                            <span className="hidden sm:inline">Info</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Tentang Asisten Teknisi AI</DialogTitle>
                                        </DialogHeader>
                                        <ScrollArea>
                                            <div className="space-y-4 text-sm max-h-[60vh]">
                                                <div>
                                                    <h4 className="font-semibold mb-2">Kemampuan</h4>
                                                    <div className="list-disc list-inside space-y-1">
                                                        <li>Troubleshooting komputer dan laptop</li>
                                                        <li>Analisis gambar perangkat teknologi</li>
                                                        <li>Panduan perbaikan step-by-step</li>
                                                        <li>Tips maintenance dan optimasi</li>
                                                        <li>Rekomendasi hardware dan software</li>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-2">Mode Offline</h4>
                                                    <p>
                                                        Jika layanan AI tidak tersedia atau Anda belum login, sistem akan memberikan bantuan dasar berdasarkan pengetahuan
                                                        troubleshooting yang tersimpan.
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-2">Tips Penggunaan</h4>
                                                    <div className="list-disc list-inside space-y-1">
                                                        <li>Deskripsikan masalah dengan detail</li>
                                                        <li>Upload foto jika ada masalah visual</li>
                                                        <li>Sebutkan merk dan model perangkat</li>
                                                        <li>Jelaskan kapan masalah mulai terjadi</li>
                                                        <li>Selalu backup data penting sebelum melakukan perbaikan</li>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold mb-2">Peringatan</h4>
                                                    <p>
                                                        Selalu backup data penting sebelum melakukan perbaikan. Konsultasi dengan teknisi profesional
                                                        untuk masalah yang kompleks.
                                                    </p>
                                                </div >
                                            </div >
                                            <ScrollBar orientation="vertical" />
                                        </ScrollArea>
                                        <div className="flex justify-end">
                                            <Button size="sm" className="h-8" onClick={() => setIsDialogOpen(false)}>Mengerti</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExampleQuestions(getRandomQuestions())}
                                    className="text-xs"
                                    disabled={isDisabled}
                                >
                                    <Shuffle className="h-3 w-3 m-0 md:mr-1" />
                                    <span className="hidden md:block">Acak Lagi</span>
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-5 h-full">
                            {exampleQuestions.map((question, index) => (
                                <Card
                                    key={index}
                                    className="text-xs md:text-md cursor-pointer hover:bg-muted/100 hover:scale-105 transition-all ease-in-out duration-200 w-fit p-0 flex items-center justify-center rounded-bl-none rounded-tl-2xl px-2 py-2 md:py-3 md:px-3"
                                    onClick={() => handleExampleClick(question)}
                                    tabIndex={isDisabled ? -1 : 0}
                                    aria-disabled={isDisabled}
                                >
                                    <p className="text-sm">{question}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {messages.map((message) => {
                        const modelInfo = message.model ? getModelBadgeInfo(message.model) : null;
                        return (
                            <div key={message.id} className="space-y-2">
                                {message.role === "assistant" ? (
                                    <div className="flex gap-3 group">
                                        <div className="flex-1 min-w-0 relative">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Brain className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium">Asisten Teknisi</span>
                                                {modelInfo && (
                                                    <Badge variant={modelInfo.variant} className={`text-xs gap-1 ${modelInfo.color}`}>
                                                        {modelInfo.icon && <modelInfo.icon className="h-3 w-3" />}
                                                        {message.model}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                                            </div>
                                            {isLoading && (
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {showOfflineWarning ? "Memproses dengan bantuan offline..." : "Sedang menganalisis..."}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                                </div>
                                                <div className="absolute -top-6 right-0">
                                                    <CopyButton content={message.content} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] space-y-2 group">
                                            {message.image && (
                                                <div className="flex justify-end">
                                                    <Image
                                                        height={200}
                                                        width={200}
                                                        src={message.image || "/placeholder.svg"}
                                                        alt="Uploaded"
                                                        className="max-w-xs rounded-lg border"
                                                    />
                                                </div>
                                            )}
                                            <div className="relative">
                                                <div className="bg-primary rounded-tr-none rounded-tb-2xl text-primary-foreground rounded-lg px-4 py-2">
                                                    <p className="text-sm">{message.content}</p>
                                                </div>
                                                <div className="absolute -top-6 right-1">
                                                    <CopyButton
                                                        content={message.content}
                                                        className="hover:bg-white/20 text-white/70 hover:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-0">
                {isProcessingImage && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses gambar...
                    </div>
                )}

                <Form {...form}>
                    <div className="max-w-4xl">
                        <form onSubmit={form.handleSubmit(handleSendMessage)} className="relative">
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div>
                                                {isFetchingTokens ? (
                                                    <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-gray-700 p-2 rounded mb-2 animate-pulse">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> <span>Memuat token...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-zinc-700 p-2 mb-2 rounded-xl">
                                                        <span>
                                                            Token tersisa: <strong>{userTokenData?.dailyTokens ?? 'N/A'}</strong>/{userTokenData?.maxDailyTokens ?? 'N/A'}
                                                        </span>
                                                        <span className="text-gray-500 dark:text-gray-300">Reset jam 7 pagi WIB</span>
                                                    </div>
                                                )}

                                                <div className="flex flex-col">
                                                    <div className="relative flex flex-col items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
                                                        <ScrollArea className="relative w-full">
                                                            {selectedImage && (
                                                                <div>
                                                                    <div className="relative inline-block">
                                                                        <Image width="200" height="200" src={selectedImage} alt="Selected" className="max-w-xs rounded-lg border" />
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="absolute top-1 right-1 h-5 w-5 rounded-full p-0"
                                                                            onClick={() => setSelectedImage(null)}
                                                                            disabled={isDisabled}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Textarea
                                                                {...field}
                                                                ref={textareaRef}
                                                                placeholder={
                                                                    selectedImage
                                                                        ? "Opsional: Tambahkan pertanyaan tentang gambar..."
                                                                        : "Tanyakan sesuatu tentang teknologi komputer..."
                                                                }
                                                                className="min-h-[60px] max-h-[200px] resize-none w-full border-0 bg-transparent px-3 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                disabled={isDisabled}
                                                                onKeyPress={handleKeyPress}
                                                                maxLength={400}
                                                            />
                                                            <div className="absolute bottom-2 right-2 text-muted-foreground text-xs">
                                                                {field.value?.length || 0}/400
                                                            </div>
                                                            <ScrollBar orientation="vertical" />
                                                        </ScrollArea>

                                                        <div className="flex justify-between items-center w-full">
                                                            <div className="flex gap-x-2 items-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={handleClearChat}
                                                                    disabled={isDisabled || messages.length === 0}
                                                                    className="h-7 md:h-10 w-7 md:w-10 hover:scale-110 cursor-pointer"
                                                                    title="Clear chat history"
                                                                >
                                                                    <BrushCleaning className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="flex gap-3 items-center">
                                                                {isMobile && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => cameraInputRef.current?.click()}
                                                                        disabled={isDisabled}
                                                                        className="h-7 md:h-8 w-7 md:w-8 hover:scale-110 cursor-pointer"
                                                                        title="Take photo"
                                                                    >
                                                                        <Camera className="h-4 w-4" />
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={isDisabled}
                                                                    className="h-7 md:h-8 w-7 md:w-8 hover:scale-110 cursor-pointer"
                                                                    title="Upload image"
                                                                >
                                                                    <ImageUp className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    type="submit"
                                                                    size="icon"
                                                                    disabled={
                                                                        isDisabled ||
                                                                        (!field.value?.trim() && !selectedImage)
                                                                    }
                                                                    className="rounded-lg h-8 md:h-9 w-8 md:w-9 hover:scale-105 cursor-pointer"
                                                                    title="Send message"
                                                                >
                                                                    {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full text-[10px] my-2 md:text-xs text-muted-foreground text-center text-shadow-black shadow-2xl">
                                                        AI dapat melakukan kesalahan. Pertimbangkan untuk mengecek ulang informasi penting.
                                                    </div>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </div>
                </Form>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                />
            </div>
        </Card>
    )
}