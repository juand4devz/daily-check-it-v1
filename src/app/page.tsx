// // app/home/page.tsx atau pages/index.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Plus, AlertCircle, MessageSquare } from "lucide-react";
// import forumPostsData from "@/data/forum-posts.json";
// import { ForumListSkeleton } from "@/components/ui/skeleton-loader";

// // Import dari file baru
// import { ForumPost } from "@/types/forum";
// import ForumPostCard from "@/components/forum/ForumPostCard";

// export default function HomePage() {
//   const [posts, setPosts] = useState<ForumPost[]>([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // Load forum post data from localStorage and JSON data
//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const localPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]");
//         const allPostsMap = new Map<string, ForumPost>();
//         // Prioritize local storage posts to allow for user-created content to override static data
//         [...forumPostsData, ...localPosts].forEach((post) => {
//           allPostsMap.set(post.id, post);
//         });
//         const allPosts = Array.from(allPostsMap.values());
//         // Sort posts by newest first (assuming timestamp exists)
//         allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
//         setPosts(allPosts);
//       } catch (error) {
//         console.error("Error loading forum data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   if (loading) {
//     return <ForumListSkeleton />;
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//         <div>
//           <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
//             <MessageSquare className="h-8 w-8 text-blue-600" />
//             Feed Beranda
//           </h1>
//           <p className="text-gray-600">Jelajahi semua postingan terbaru dari komunitas</p>
//         </div>
//         <Button onClick={() => router.push("/forum/new")} className="shrink-0 md:hidden">
//           <Plus className="mr-2 h-4 w-4" />
//           Buat Pertanyaan
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Main Content: Posts Grid */}
//         <div className="lg:col-span-4 space-y-6"> {/* Changed to lg:col-span-4 to occupy full width */}
//           <div className="grid grid-cols-1 md:grid-cols-3  gap-6">
//             {posts.length > 0 ? (
//               posts.map((post) => (
//                 <ForumPostCard key={post.id} post={post} />
//               ))
//             ) : (
//               <div className="col-span-full">
//                 <Card>
//                   <CardContent className="p-8 text-center">
//                     <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium mb-2">
//                       Tidak ada postingan ditemukan
//                     </h3>
//                     <p className="text-gray-600 mb-4">
//                       Belum ada postingan di feed ini.
//                     </p>
//                     <Button onClick={() => router.push("/forum/new")}>
//                       <Plus className="mr-2 h-4 w-4" />
//                       Buat Postingan Pertama
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//                 @keyframes shimmer {
//                     0% {
//                         transform: translateX(-100%);
//                     }
//                     100% {
//                         transform: translateX(100%);
//                     }
//                 }
//                 .animate-shimmer {
//                     animation: shimmer 2s infinite;
//                 }
//             `}</style>
//     </div>
//   );
// }