import { cn } from '@/lib/utils';

/** White dashboard panel — cards, sections */
export const adminPanelClass = cn(
  'admin-panel-card text-card-foreground'
);

/** Section eyebrow label */
export const adminSectionTitleClass = cn('admin-section-eyebrow');

/** Page heading inside AdminLayout body */
export const adminPageTitleClass = cn(
  'text-2xl font-semibold tracking-[-0.025em] text-foreground md:text-3xl'
);

export const adminPageSubtitleClass = cn('mt-1 text-sm text-muted-foreground md:text-base');

/** Stat metric number */
export const adminStatValueClass = cn('text-[22px] font-extrabold tabular-nums tracking-tight md:text-3xl');
