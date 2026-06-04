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

/** ⋮ on image/hero cards — visible on phone, hover-reveal on desktop */
export const adminCardMenuTriggerOverlayClass = cn(
  'absolute right-2 top-2 z-10 h-10 w-10 bg-background/90 opacity-100 shadow-sm backdrop-blur-sm',
  'md:right-3 md:top-3 md:h-8 md:w-8 md:bg-secondary md:opacity-0 md:transition-opacity md:group-hover:opacity-100'
);

/** ⋮ beside card titles */
export const adminCardMenuTriggerClass = cn('h-10 w-10 shrink-0 md:h-8 md:w-8');

/** Dialogs on phone */
export const adminDialogMobileClass = cn('max-md:w-[95vw] max-md:max-h-[90dvh] max-md:overflow-y-auto');

/** Record edit (venue, album, event, service): form + preview column */
export const adminRecordEditLayoutClass = cn(
  'grid min-w-0 gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:gap-8'
);

export const adminRecordEditFormStackClass = cn('min-w-0 space-y-4 md:space-y-5');

/** Preview card above form on phone, sidebar on desktop */
export const adminRecordEditPreviewAsideClass = cn(
  'order-first min-w-0 lg:order-none lg:sticky lg:top-28 lg:self-start'
);

/** Stat metric number */
export const adminStatValueClass = cn('text-[22px] font-extrabold tabular-nums tracking-tight md:text-3xl');
