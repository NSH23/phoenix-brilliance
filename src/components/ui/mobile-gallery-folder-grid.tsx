import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

export type MobileGalleryFolder = {
  id: string;
  name: string;
  count: number;
  previewUrls: string[];
  onClick?: () => void;
};

type MobileGalleryFolderGridProps = {
  folders: MobileGalleryFolder[];
  className?: string;
};

function FolderCover({ previewUrls }: { previewUrls: string[] }) {
  const coverUrl = previewUrls[0];

  if (!coverUrl) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-muted via-muted/80 to-primary/5" aria-hidden />
    );
  }

  return (
    <OptimizedImage
      src={coverUrl}
      alt=""
      aria-hidden
      preset="card"
      className="h-full w-full object-cover"
    />
  );
}

function MobileGalleryFolderCard({
  folder,
  index,
}: {
  folder: MobileGalleryFolder;
  index: number;
}) {
  const countLabel = folder.count === 1 ? "1 item" : `${folder.count} items`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      className="min-w-0"
    >
      <button
        type="button"
        onClick={folder.onClick}
        className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Open ${folder.name}, ${countLabel}`}
      >
        <div className="aspect-square overflow-hidden rounded-xl bg-muted/40 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 active:scale-[0.98]">
          <FolderCover previewUrls={folder.previewUrls} />
        </div>
        <div className="mt-2 px-0.5">
          <p className="truncate text-[15px] font-medium leading-snug text-foreground">{folder.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
        </div>
      </button>
    </motion.div>
  );
}

/** Phone gallery app-style album grid — 2 columns, single cover image, labels below. */
export function MobileGalleryFolderGrid({ folders, className }: MobileGalleryFolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-5",
        folders.length === 1 && "mx-auto max-w-[11rem] grid-cols-1",
        className,
      )}
    >
      {folders.map((folder, index) => (
        <MobileGalleryFolderCard key={folder.id} folder={folder} index={index} />
      ))}
    </div>
  );
}

export default MobileGalleryFolderGrid;
