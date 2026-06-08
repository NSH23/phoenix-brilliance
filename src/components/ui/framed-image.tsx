import { cn } from '@/lib/utils';
import { optimizeMediaUrl, type ImageDeliveryPreset } from '@/lib/mediaDelivery';

export type MediaFit = 'contain' | 'cover';
export type UniformMediaAspect = 'square' | '4/3' | '16/10' | 'video';

const uniformAspectClass: Record<UniformMediaAspect, string> = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
  video: 'aspect-video',
};

type UniformMediaFrameProps = {
  src: string;
  alt?: string;
  /** Fixed outer ratio — tile size is identical regardless of image dimensions. */
  aspect?: UniformMediaAspect;
  /** Fixed height instead of aspect (e.g. logo strip `h-24`). */
  heightClass?: string;
  className?: string;
  frameClassName?: string;
  imgClassName?: string;
  children?: React.ReactNode;
};

/**
 * Fixed-size tile with the image centered via max-width/max-height contain.
 * Prevents cards from growing/shrinking based on uploaded image proportions.
 */
export function UniformMediaFrame({
  src,
  alt = '',
  aspect = 'square',
  heightClass,
  className,
  frameClassName,
  imgClassName,
  children,
}: UniformMediaFrameProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/25',
        heightClass ?? uniformAspectClass[aspect],
        frameClassName,
        className,
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
        <img
          src={optimizeMediaUrl(src, { preset: 'card' })}
          alt={alt}
          className={cn('max-h-full max-w-full object-contain', imgClassName)}
          loading="lazy"
          decoding="async"
          draggable={false}
          data-protected-media=""
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      {children}
    </div>
  );
}

type FramedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** How the image fills its frame. Default `contain` shows the full image without cropping. */
  fit?: MediaFit;
  /** Outer frame classes (aspect ratio, size, rounded corners, etc.). */
  frameClassName?: string;
  /** Inner padding when using `contain` so logos/banners breathe inside the frame. */
  padding?: 'none' | 'sm' | 'md';
  /** Cloudinary delivery preset for faster loads. */
  deliveryPreset?: ImageDeliveryPreset;
  /** Disable casual save/drag on public pages. */
  protect?: boolean;
};

const paddingMap = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
} as const;

/**
 * Image inside a fixed frame. Uses `object-contain` by default so uploads are fully visible.
 */
export function FramedImage({
  fit = 'contain',
  frameClassName,
  className,
  padding = 'sm',
  alt = '',
  src,
  deliveryPreset = 'card',
  protect = true,
  draggable = false,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: FramedImageProps) {
  const isContain = fit === 'contain';
  const resolvedSrc = src ? optimizeMediaUrl(src, { preset: deliveryPreset }) : src;

  return (
    <div
      className={cn(
        'overflow-hidden',
        isContain && 'bg-muted/25',
        isContain && paddingMap[padding],
        frameClassName,
      )}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        draggable={draggable}
        data-protected-media={protect ? '' : undefined}
        onContextMenu={protect ? (e) => e.preventDefault() : props.onContextMenu}
        className={cn(
          'h-full w-full',
          isContain ? 'object-contain' : 'object-cover',
          className,
        )}
        {...props}
      />
    </div>
  );
}
