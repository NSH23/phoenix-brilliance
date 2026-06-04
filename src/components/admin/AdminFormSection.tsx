import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { adminPanelClass } from '@/components/admin/adminStyles';

type AdminFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
};

export default function AdminFormSection({
  title,
  description,
  children,
  className,
  headerRight,
}: AdminFormSectionProps) {
  return (
    <section className={cn(adminPanelClass, 'overflow-hidden', className)}>
      <header className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 px-4 py-3 max-md:items-stretch sm:flex-row sm:items-start sm:px-5 sm:py-3.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0 self-start sm:self-auto">{headerRight}</div> : null}
      </header>
      <div className="space-y-4 px-4 py-4 max-md:px-3 sm:px-5">{children}</div>
    </section>
  );
}
