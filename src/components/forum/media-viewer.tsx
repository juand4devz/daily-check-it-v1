// /components/forum/media-viewer.tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ForumMedia } from "@/types/forum"; // Import ForumMedia langsung

// Gunakan ForumMedia sebagai tipe dasar untuk MediaItem di sini
// Ini memastikan konsistensi antara data yang disimpan dan yang ditampilkan
interface MediaViewerProps {
  media: ForumMedia[]; // Menggunakan ForumMedia[] langsung
  className?: string;
}

export function MediaViewer({ media, className = "" }: MediaViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!media || media.length === 0) return null;

  const currentMedia = media[selectedIndex];

  // Helper component untuk pratinjau individu
  const MediaPreview = ({ item, index }: { item: ForumMedia; index: number }) => ( // Gunakan ForumMedia
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
            height={500}
            width={500}
            src={item.url || ""}
            alt={`Media ${item.filename || 'item'} ${index + 1}`} // Gunakan item.filename
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="relative">
            <video
              src={item.url}
              className="w-full h-48 object-cover"
              poster={item.thumbnailUrl || undefined} // Gunakan thumbnailUrl jika ada
              // Tambahkan `preload="metadata"` untuk membantu browser memuat poster
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-12 w-12 text-white" />
            </div>
          </div>
        )}

        {/* Expand Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0" aria-label="Expand media">
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
          height={500}
          width={500}
          src={currentMedia.url || "/placeholder.svg"}
          alt={`Full size media ${currentMedia.filename || 'item'}`}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <video src={currentMedia.url} className="max-w-full max-h-full object-contain" controls autoPlay />
      )}

      {/* Close Button
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
        onClick={() => setIsOpen(false)}
        aria-label="Close full screen media"
      >
        <X className="h-5 w-5" />
      </Button> */}

      {/* Navigation for multiple media */}
      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
            aria-label="Previous media"
          >
            ←
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => setSelectedIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
            aria-label="Next media"
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
      {/* Batasi jumlah preview yang ditampilkan di grid, lalu tambahkan "Lihat Semua" */}
      {media.slice(0, media.length > 4 ? 3 : media.length).map((item, index) => (
        <MediaPreview key={item.id || index} item={item} index={index} /> // Gunakan item.id sebagai key
      ))}
      {media.length > 4 && (
        <div
          className="relative group cursor-pointer"
          onClick={() => { setSelectedIndex(3); setIsOpen(true); }} // Buka galeri dari item ke-4
        >
          <div className="relative overflow-hidden rounded-lg h-48">
            <Image
              height={500}
              width={500}
              src={media[3].url || "/placeholder.svg"} // Tampilkan gambar ke-4 sebagai pratinjau
              alt={`Media ${4} more`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <span className="text-white font-medium text-xl">+{media.length - 3}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle className="hidden" /> {/* Sembunyikan judul dialog */}
        <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 border-0 bg-black">
          <FullScreenMedia />
        </DialogContent>
      </Dialog>
    </div>
  );
}