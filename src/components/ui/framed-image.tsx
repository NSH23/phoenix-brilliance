import { cn } from '@/lib/utils';

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
          src={src}
          alt={alt}
          className={cn('max-h-full max-w-full object-contain', imgClassName)}
          loading="lazy"
          decoding="async"
          draggable={false}
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
  ...props
}: FramedImageProps) {
  const isContain = fit === 'contain';

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
        alt={alt}
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
