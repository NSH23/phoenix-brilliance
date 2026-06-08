import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Wraps all public routes: discourages casual image save/drag/copy.
 * Note: OS-level screenshots and devtools cannot be blocked on the open web.
 */
export default function PublicSiteLayout() {
  const blockMediaContextMenu = useCallback((event: React.MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('img, video, picture, [data-protected-media]')) {
      event.preventDefault();
    }
  }, []);

  const blockMediaDrag = useCallback((event: React.DragEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('img, video, picture, [data-protected-media]')) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      className="public-site min-h-screen"
      onContextMenu={blockMediaContextMenu}
      onDragStart={blockMediaDrag}
    >
      <Outlet />
    </div>
  );
}
