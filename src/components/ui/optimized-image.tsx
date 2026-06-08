import { cn } from '@/lib/utils';
import {
  buildMediaSrcSet,
  optimizeMediaUrl,
  sizesForPreset,
  type ImageDeliveryPreset,
} from '@/lib/mediaDelivery';

type OptimizedImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'sizes'
> & {
  src: string;
  preset?: ImageDeliveryPreset;
  width?: number;
  responsive?: boolean;
  sizes?: string;
  protect?: boolean;
};

export function OptimizedImage({
  src,
  preset = 'card',
  width,
  responsive = true,
  sizes,
  protect = true,
  className,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  draggable = false,
  onContextMenu: userContextMenu,
  ...props
}: OptimizedImageProps) {
  const optimizedSrc = optimizeMediaUrl(src, width ? { width } : { preset });
  const srcSet = responsive && !width ? buildMediaSrcSet(src, preset) : undefined;
  const resolvedSizes = sizes ?? (srcSet ? sizesForPreset(preset) : undefined);

  return (
    <img
      {...props}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={resolvedSizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      draggable={draggable}
      data-protected-media={protect ? '' : undefined}
      className={cn(className)}
      onContextMenu={
        protect
          ? (e) => {
              e.preventDefault();
              userContextMenu?.(e);
            }
          : userContextMenu
      }
    />
  );
}
