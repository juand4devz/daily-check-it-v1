// /components/forum/media-viewer.tsx (Minimal perubahan, verifikasi tipe)
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, Play, X } from "lucide-react"; // Re-added X for clarity
import Image from "next/image";
import { cn } from "@/lib/utils"; // Assuming cn utility

// Ensure consistency with @/types/forum/ForumMedia
interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string; // Changed from thumbnail to thumbnailUrl for consistency
}

interface MediaViewerProps {
  media: MediaItem[];
  className?: string;
}

export function MediaViewer({ media, className = "" }: MediaViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!media || media.length === 0) return null;

  const currentMedia = media[selectedIndex];

  const MediaPreview = ({ item, index }: { item: MediaItem; index: number }) => (
    <div
      className="relative group cursor-pointer"
      onClick={() => {
        setSelectedIndex(index);
        setIsOpen(true);
      }}
    >
      <div className="relative overflow-hidden rounded-lg">
        {item.type === "image" ? (
          <Image
            height={500} // Added explicit height/width for Next/Image
            width={500}
            src={item.url || "/placeholder.svg"}
            alt={`Media ${index + 1}`}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="relative">
            <video src={item.url} className="w-full h-48 object-cover" poster={item.thumbnailUrl} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
        )}

        {/* Expand Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
            <Expand className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );

  const FullScreenMedia = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {currentMedia.type === "image" ? (
        <Image
          height={1000} // Larger size for full screen
          width={1000}
          src={currentMedia.url || "/placeholder.svg"}
          alt="Full size media"
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <video src={currentMedia.url} className="max-w-full max-h-full object-contain" controls autoPlay />
      )}

      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-5 w-5" /> {/* Re-added X icon */}
      </Button>

      {/* Navigation for multiple media */}
      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setSelectedIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
          >
            →
          </Button>

          {/* Media Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {media.length}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={cn("grid gap-2", className, media.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {media.slice(0, media.length > 4 ? 3 : media.length).map((item, index) => (
        <MediaPreview key={index} item={item} index={index} />
      ))}
      {media.length > 4 && (
        <div
          className="relative group cursor-pointer"
          onClick={() => { setSelectedIndex(3); setIsOpen(true); }} // Open gallery from 4th item
        >
          <div className="relative overflow-hidden rounded-lg h-48">
            <Image
              height={500}
              width={500}
              src={media[3].url || "/placeholder.svg"} // Show 4th image as preview
              alt={`Media ${4}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <span className="text-white font-medium text-xl">+{media.length - 3}</span> {/* Correct count */}
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle className="hidden" />
        <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 border-0 bg-black">
          <FullScreenMedia />
        </DialogContent>
      </Dialog>
    </div>
  );
}