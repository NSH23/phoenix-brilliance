import type { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminSortableGridProps = {
  itemIds: string[];
  onReorder: (orderedIds: string[]) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function AdminSortableGrid({
  itemIds,
  onReorder,
  disabled,
  className,
  children,
}: AdminSortableGridProps) {
  // Handle-only activation (setActivatorNodeRef on grip): distance 0 so mouse / trackpad / touch
  // start immediately from the grip. Do not add TouchSensor — it fights Pointer on hybrid devices
  // and the long-press delay makes dragging feel sticky.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(itemIds, oldIndex, newIndex);
    void onReorder(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      autoScroll={{ acceleration: 12, interval: 6, threshold: { x: 0.12, y: 0.12 } }}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

type AdminSortableItemProps = {
  id: string;
  disabled?: boolean;
  /** Larger hit area on touch screens */
  className?: string;
  /** `dark` = readable on photos; `light` = default admin card */
  handleTone?: 'light' | 'dark';
  children: ReactNode;
};

export function AdminSortableItem({
  id,
  disabled,
  className,
  handleTone = 'light',
  children,
}: AdminSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full min-h-0',
        isDragging && 'opacity-95 shadow-lg ring-2 ring-primary/40 rounded-xl',
        className
      )}
    >
      {!disabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={cn(
            'absolute left-1 top-1 z-[25] flex touch-none select-none items-center justify-center rounded-md border p-2 shadow-sm ring-1 backdrop-blur-[2px]',
            'cursor-grab active:cursor-grabbing active:scale-[0.98]',
            'min-h-9 min-w-9 max-md:left-2 max-md:top-2 max-md:min-h-11 max-md:min-w-11 max-md:p-2.5',
            handleTone === 'dark'
              ? 'border-white/30 bg-black/45 text-white ring-white/20 hover:bg-black/60 hover:text-white'
              : 'border-border bg-background/95 text-muted-foreground ring-border hover:bg-muted hover:text-foreground'
          )}
          aria-label="Drag to reorder"
          title="Drag by this handle to reorder"
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 shrink-0 max-md:h-5 max-md:w-5" aria-hidden />
        </button>
      )}
      {children}
    </div>
  );
}
