import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function AspectRatioDemo() {
  return (
    <div className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b8?w=800&q=80"
          alt="Event venue banquet hall"
          className="h-full w-full rounded-lg object-cover object-center"
          loading="lazy"
        />
      </AspectRatio>
    </div>
  );
}
