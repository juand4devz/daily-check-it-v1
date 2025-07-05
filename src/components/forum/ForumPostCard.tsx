// components/ForumPostCard.tsx
import { FC } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Heart, CheckCircle, ImageIcon } from "lucide-react";
import { ForumPost } from "@/types/forum";
import { getTimeAgo, getCategoryIcon, getRandomGradient } from "@/lib/utils/forum";

interface ForumPostCardProps {
    post: ForumPost;
}

const ForumPostCard: FC<ForumPostCardProps> = ({ post }) => {
    const router = useRouter();
    const IconComponent = getCategoryIcon(post.category);
    const hasMedia = post.media && post.media.length > 0;
    const thumbnail = hasMedia ? post.media![0].url : null;

    return (
        <Card
            key={post.id}
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group py-0 overflow-hidden"
            onClick={() => router.push(`/forum/${post.id}`)}
        >
            <div>
                {/* Thumbnail or Placeholder */}
                <div className="relative h-48 overflow-hidden">
                    {thumbnail ? (
                        <Image
                            height={500}
                            width={500}
                            src={thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div
                            className={`w-full h-full ${getRandomGradient(
                                post.id
                            )} animate-pulse relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <IconComponent className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="secondary" className="bg-black/50 text-white border-0">
                            {post.category}
                        </Badge>
                        {post.isResolved && (
                            <Badge className="bg-green-600 text-white border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selesai
                            </Badge>
                        )}
                    </div>

                    {/* Media indicator */}
                    {hasMedia && (
                        <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {post.media!.length}
                            </Badge>
                        </div>
                    )}
                </div>

                <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={post.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{post.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{post.author}</p>
                            <p className="text-xs text-gray-500">{getTimeAgo(post.timestamp)}</p>
                        </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.content}</p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                </Badge>
                            ))}
                            {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.replies}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default ForumPostCard;