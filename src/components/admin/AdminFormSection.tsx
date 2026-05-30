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
      <header className="flex items-start justify-between gap-3 border-b border-border/50 bg-muted/20 px-5 py-3.5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </header>
      <div className="space-y-4 px-5 py-4">{children}</div>
    </section>
  );
}
