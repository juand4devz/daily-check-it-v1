// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowRight, Brain, FlaskConical } from "lucide-react";
import { GuestHomeSkeleton } from "@/components/forum/guest-home-skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import ForumDetailContent from "@/components/forum/ForumDetailContent";
import { GuestPostCard } from "@/components/forum/GuestPostCard";

import {
    ForumPost,
} from "@/lib/utils/forum-utils";

// Komponen Hero Section yang lebih kecil dan minimalis
const HeroSection = ({ onStartDiagnosis, onAIassistance }: { onStartDiagnosis: () => void; onAIassistance: () => void; }) => (
    <div className="text-center mb-12 py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-blue-950 rounded-xl shadow-lg animate-fade-in">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
            Komunitas yang Saling Membantu
        </h1>
        <p className="text-md text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
            Diskusikan masalah Anda, dapatkan wawasan, atau jelajahi berbagai topik menarik dari para ahli dan pengguna lain.
        </p>
        <div className="flex justify-center gap-3">
            <Button size="sm" onClick={onStartDiagnosis}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Mulai Diagnosis
            </Button>
            <Button size="sm" variant="secondary" onClick={onAIassistance}>
                <Brain className="mr-2 h-4 w-4" />
                AI Assistance
            </Button>
        </div>
    </div>
);

export default function GuestHomePage() {
    const [latestPosts, setLatestPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchLatestPosts = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/forum/posts");
                if (!response.ok) {
                    throw new Error("Failed to fetch latest posts");
                }
                const data = await response.json();
                if (data.status) {
                    const sortedPosts = data.data
                        .sort((a: ForumPost, b: ForumPost) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 20);
                    setLatestPosts(sortedPosts);
                } else {
                    toast.error("Gagal memuat postingan terbaru", { description: data.message });
                }
            } catch (error) {
                console.error("Error fetching latest forum data:", error);
                toast.error("Error", { description: "Gagal memuat data forum terbaru." });
            } finally {
                setLoading(false);
            }
        };

        fetchLatestPosts();
    }, []);

    const handleCardClick = useCallback((post: ForumPost) => {
        setSelectedPostId(post.id);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedPostId(null);
    }, []);

    if (loading) {
        return <GuestHomeSkeleton />;
    }

    return (
        <div className="px-4 py-8 w-full">
            <HeroSection
                onStartDiagnosis={() => router.push("/diagnose")}
                onAIassistance={() => router.push("/ai-assistance")}
            />

            <hr className="my-12 border-t border-gray-200 dark:border-gray-800" />

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-blue-500" />
                    Highlight Diskusi Terbaru
                </h2>
                <Button variant="ghost" onClick={() => router.push("/forum")}>
                    Lihat Semua Forum <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {latestPosts.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada diskusi terbaru</h3>
                        <p className="text-gray-600 mb-4">Sepertinya belum ada postingan forum yang dibuat.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {latestPosts.map((post) => (
                        <GuestPostCard key={post.id} post={post} onClick={handleCardClick} />
                    ))}
                </div>
            )}

            {/* Perbaikan: Mengatur lebar modal menjadi max-w-4xl atau 'xl' */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                    <VisuallyHidden>
                        <DialogTitle>Detail Postingan Forum</DialogTitle>
                        <DialogDescription>Menampilkan informasi detail dari postingan forum yang dipilih.</DialogDescription>
                    </VisuallyHidden>

                    {selectedPostId && (
                        <ForumDetailContent postId={selectedPostId} isModal={true} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}