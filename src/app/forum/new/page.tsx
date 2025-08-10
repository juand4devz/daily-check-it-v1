// /app/forum/new/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ForumPost } from "@/types/forum"; // Import ForumPost type
import { ForumPostForm } from "@/components/forum/ForumPostForm"; // Import the reusable form component
import { DiagnosisData } from "@/lib/utils/types"; // Import DiagnosisData

export default function NewForumPostPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const username = session?.user?.username;
  // const avatar = session?.user?.avatar;
  const router = useRouter();

  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- EFFECT: Auth check and load diagnosis data ---
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (!userId) {
      toast.error("Anda harus login untuk membuat postingan baru.", { duration: 3000 });
      router.push("/login");
      return;
    }

    const storedData = sessionStorage.getItem("forumPostData");
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as DiagnosisData;
        setDiagnosisData(data);
        sessionStorage.removeItem("forumPostData"); // Clear after use
      } catch (error) {
        console.error("Error parsing diagnosis data:", error);
        toast.error("Error", { description: "Gagal memuat data diagnosa otomatis." });
      }
    }
    setIsLoadingPage(false);
  }, [userId, status, router]);

  const handleSubmit = useCallback(async (
    postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>,
    postId?: string // Not used for new post, but required by prop signature
  ) => {
    if (!userId || !username) {
      toast.error("Data pengguna tidak lengkap. Harap refresh atau login ulang.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        toast.success("Diskusi berhasil dibuat", {
          description: "Diskusi Anda telah dipublikasikan",
        });
        router.push(`/forum/${data.postId}`);
      } else {
        throw new Error(data.message || "Terjadi kesalahan saat menyimpan diskusi.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Gagal membuat diskusi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan diskusi",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, username, router]);


  return (
    <ForumPostForm
      pageTitle="Buat Diskusi Baru"
      pageDescription="Bagikan pertanyaan, pengetahuan, atau pengalaman Anda"
      backUrl="/forum"
      onSubmit={handleSubmit}
      isLoadingInitialData={isLoadingPage} // Pass page loading state
      isSubmitting={isSubmitting}
      diagnosisData={diagnosisData}
    />
  );
}