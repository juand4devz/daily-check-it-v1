"use client";

import { useParams } from "next/navigation";
import ForumDetailContent from "@/components/forum/ForumDetailContent";

export default function ForumDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  return <ForumDetailContent postId={postId} />;
}