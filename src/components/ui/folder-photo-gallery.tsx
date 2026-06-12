import { cn } from "@/lib/utils";

import { GalleryPhotoTile, type GalleryPhotoTileItem } from "@/components/ui/gallery-photo-tile";



export type FolderGalleryItem = GalleryPhotoTileItem;



type FolderPhotoGalleryProps = {

  items: FolderGalleryItem[];

  onItemClick: (index: number) => void;

  className?: string;

};



/** Uniform album grid — clean spacing, minimal chrome. */

export function FolderPhotoGallery({ items, onItemClick, className }: FolderPhotoGalleryProps) {

  if (items.length === 0) return null;



  return (

    <div

      className={cn(

        "grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 lg:gap-2.5",

        items.length === 1 && "mx-auto max-w-[16rem] grid-cols-1",

        items.length === 2 && "sm:max-w-xl sm:grid-cols-2",

        className,

      )}

    >

      {items.map((item, index) => (

        <GalleryPhotoTile

          key={item.id ?? index}

          item={item}

          index={index}

          variant="album"

          ratio={1}

          onClick={() => onItemClick(index)}

        />

      ))}

    </div>

  );

}



export default FolderPhotoGallery;

