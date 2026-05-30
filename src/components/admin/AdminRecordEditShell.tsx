import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type TabDef = { value: string; label: string; disabled?: boolean };

type AdminRecordEditShellProps = {
  title: string;
  subtitle: string;
  backHref: string;
  backLabel?: string;
  saving?: boolean;
  loading?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  tabs: TabDef[];
  defaultTab?: string;
  details: ReactNode;
  gallery?: ReactNode;
  extraTabs?: Array<{ value: string; label: string; content: ReactNode }>;
};

export default function AdminRecordEditShell({
  title,
  subtitle,
  backHref,
  backLabel = 'Back to list',
  saving = false,
  loading = false,
  onSave,
  onDelete,
  tabs,
  defaultTab = 'details',
  details,
  gallery,
  extraTabs = [],
}: AdminRecordEditShellProps) {
  if (loading) {
    return (
      <AdminLayout title="Loading…" subtitle="">
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={title}
      subtitle={subtitle}
      headerBack={
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground" asChild>
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      }
      headerActions={
        <div className="flex items-center gap-2">
          {onDelete ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete record"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
          <Button size="sm" className="gap-1.5" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      }
    >
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList
          className={cn(
            'mb-6 h-auto w-full justify-start gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 sm:w-auto'
          )}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className="rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details" className="mt-0 focus-visible:outline-none">
          {details}
        </TabsContent>

        {gallery ? (
          <TabsContent value="gallery" className="mt-0 focus-visible:outline-none">
            {gallery}
          </TabsContent>
        ) : null}

        {extraTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0 focus-visible:outline-none">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}
