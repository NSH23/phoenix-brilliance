import { useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTA from "@/components/MobileCTA";
import { shouldHidePublicFooter } from "@/lib/publicSiteLayout";

/**
 * Wraps all public routes: discourages casual image save/drag/copy.
 * Note: OS-level screenshots and devtools cannot be blocked on the open web.
 */
export default function PublicSiteLayout() {
  const { pathname } = useLocation();
  const hideFooter = shouldHidePublicFooter(pathname);

  const blockMediaContextMenu = useCallback((event: React.MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("img, video, picture, [data-protected-media]")) {
      event.preventDefault();
    }
  }, []);

  const blockMediaDrag = useCallback((event: React.DragEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("img, video, picture, [data-protected-media]")) {
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
      {!hideFooter ? <Footer /> : null}
      <WhatsAppButton />
      <MobileCTA />
    </div>
  );
}
