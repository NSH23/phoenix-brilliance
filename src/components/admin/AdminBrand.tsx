import { cn } from '@/lib/utils';

type AdminBrandProps = {
  workspace?: 'website' | 'wp';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: { title: 'text-lg tracking-[-0.03em]', tagline: 'text-[10px]' },
  md: { title: 'text-xl tracking-[-0.03em]', tagline: 'text-xs' },
  lg: { title: 'text-2xl sm:text-3xl tracking-[-0.02em]', tagline: 'text-xs' },
};

export default function AdminBrand({
  workspace = 'website',
  size = 'md',
  showTagline = true,
  className,
}: AdminBrandProps) {
  const s = sizeClasses[size];
  const portal = workspace === 'wp' ? 'Agent' : 'Admin';

  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('font-brand font-semibold leading-tight', s.title)}>
        <span className="text-foreground">Phoenix</span>
        <span className="admin-brand-accent font-medium"> {portal}</span>
      </p>
      {showTagline && (
        <p className={cn('mt-0.5 text-muted-foreground', s.tagline)}>
          {workspace === 'wp' ? 'WhatsApp lead workspace' : 'Website content workspace'}
        </p>
      )}
    </div>
  );
}
