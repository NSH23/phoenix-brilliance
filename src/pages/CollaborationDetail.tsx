import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ArrowLeft, ArrowRight, ExternalLink, Phone, X, ChevronLeft, ChevronRight,
  Building2, Camera, Loader2, FolderOpen, Folder, ChevronDown, ChevronRight as ChevronRightIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getCollaborationById } from "@/services/collaborations";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

type CollaborationDetail = Awaited<ReturnType<typeof getCollaborationById>>;
type CollabImage = { id: string; image_url: string; caption: string | null; folder_id?: string | null; media_type?: 'image' | 'video' };
type CollabFolder = { id: string; parent_id: string | null; name: string; display_order: number; is_enabled?: boolean };
type CollabStep = { id: string; step_number: number; title: string; description: string | null };
type FolderNode = { folder: CollabFolder; children: FolderNode[]; images: CollabImage[] };

const UNCategorizedId = '__uncategorized__';

function GalleryTreeAndContent({
  folderTree,
  uncategorized,
  images,
  onOpenLightbox,
}: {
  folderTree: FolderNode[];
  uncategorized: CollabImage[];
  images: CollabImage[];
  onOpenLightbox: (index: number) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(folderTree.map(n => n.folder.id)));
  const [selectedId, setSelectedId] = useState<string | null>(folderTree[0]?.folder.id ?? UNCategorizedId);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedImages = (() => {
    if (selectedId === UNCategorizedId) return uncategorized;
    let out: CollabImage[] = [];
    function collect(node: FolderNode) {
      if (node.folder.id === selectedId) { out = node.images; return; }
      node.children.forEach(collect);
    }
    folderTree.forEach(collect);
    return out;
  })();

  const selectedLabel = (() => {
    if (selectedId === UNCategorizedId) return 'Other';
    let name = '';
    function find(n: FolderNode) {
      if (n.folder.id === selectedId) { name = n.folder.name; return; }
      n.children.forEach(find);
    }
    folderTree.forEach(find);
    return name || 'Gallery';
  })();

  function renderNode(node: FolderNode, depth: number) {
    const isExpanded = expandedIds.has(node.folder.id);
    const isSelected = selectedId === node.folder.id;
    const hasChildren = node.children.length > 0;
    return (
      <div key={node.folder.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSelectedId(node.folder.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(node.folder.id); } }}
          className={`w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left transition-colors cursor-pointer ${isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-muted/70'}`}
          style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.folder.id); }}
              className="p-0.5 shrink-0 rounded hover:bg-muted"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          {isExpanded || !hasChildren ? <FolderOpen className="w-4 h-4 shrink-0 text-primary" /> : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />}
          <span className="text-sm font-medium truncate">{node.folder.name}</span>
          {node.images.length > 0 && <span className="text-xs text-muted-foreground ml-auto">({node.images.length})</span>}
        </div>
        {hasChildren && isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="rounded-xl border bg-card overflow-hidden shrink-0"
      >
        <div className="p-3 border-b bg-muted/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {folderTree.map(node => renderNode(node, 0))}
          <button
            type="button"
            onClick={() => setSelectedId(UNCategorizedId)}
            className={`w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left transition-colors hover:bg-muted/70 ${selectedId === UNCategorizedId ? 'bg-primary/15 text-primary' : ''}`}
          >
            <span className="w-5 shrink-0" />
            <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">Other</span>
            {uncategorized.length > 0 && <span className="text-xs text-muted-foreground ml-auto">({uncategorized.length})</span>}
          </button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="min-h-[300px]"
      >
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{selectedLabel}</h3>
        </div>
        {selectedImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {selectedImages.map((media, i) => {
              const globalIndex = images.indexOf(media);
              const isVideo = media.media_type === 'video';
              return (
                <motion.div key={media.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }} className="aspect-square min-h-0">
                  <div className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group" onClick={() => globalIndex >= 0 && onOpenLightbox(globalIndex)}>
                    {isVideo ? (
                      <video
                        src={media.image_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        playsInline
                        preload="none"
                      />
                    ) : (
                      <img src={media.image_url} alt={media.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
            No images in this folder
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CollaborationDetail() {
  const { partnerId } = useParams();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef(0);
  const [collaboration, setCollaboration] = useState<CollaborationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const rawImages = useMemo<CollabImage[]>(() => {
    const c = collaboration as Record<string, unknown> | null | undefined;
    if (!c) return [];
    const imgs = c.collaboration_images ?? c.collaborationImages;
    return Array.isArray(imgs) ? (imgs as CollabImage[]) : [];
  }, [collaboration]);
  const rawFolders = useMemo<CollabFolder[]>(() => {
    const c = collaboration as Record<string, unknown> | null | undefined;
    if (!c) return [];
    const folders = c.collaboration_folders ?? c.collaborationFolders;
    const arr = Array.isArray(folders) ? (folders as CollabFolder[]) : [];
    const sorted = [...arr].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return sorted.filter(f => f.is_enabled !== false);
  }, [collaboration]);
  const steps = useMemo<CollabStep[]>(
    () => ((collaboration as any)?.collaboration_steps || []).slice().sort((a: CollabStep, b: CollabStep) => a.step_number - b.step_number),
    [collaboration]
  );

  const { images, folderTree, uncategorized } = useMemo(() => {
    const folders = rawFolders;
    const imgs = rawImages;
    const rootFolders = folders.filter(f => !f.parent_id).sort((a, b) => a.display_order - b.display_order);
    const byParent = new Map<string, CollabFolder[]>();
    folders.filter(f => f.parent_id).forEach(f => {
      if (!byParent.has(f.parent_id!)) byParent.set(f.parent_id!, []);
      byParent.get(f.parent_id!)!.push(f);
    });
    byParent.forEach(list => list.sort((a, b) => a.display_order - b.display_order));
    const sortByOrder = (a: CollabImage, b: CollabImage) => ((a as { display_order?: number }).display_order ?? 0) - ((b as { display_order?: number }).display_order ?? 0);
    const buildNode = (folder: CollabFolder): FolderNode => ({
      folder,
      children: (byParent.get(folder.id) || []).map(buildNode),
      images: imgs.filter(img => (img.folder_id ?? null) === folder.id).sort(sortByOrder),
    });
    const folderTree: FolderNode[] = rootFolders.map(buildNode);
    const uncategorized = imgs.filter(img => !img.folder_id).sort(sortByOrder);
    const allOrdered: CollabImage[] = [];
    function flatten(node: FolderNode) {
      node.images.forEach(i => allOrdered.push(i));
      node.children.forEach(flatten);
    }
    folderTree.forEach(flatten);
    uncategorized.forEach(i => allOrdered.push(i));
    return { images: allOrdered, folderTree, uncategorized };
  }, [rawImages, rawFolders]);

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    getCollaborationById(partnerId)
      .then(setCollaboration)
      .catch(() => setCollaboration(null))
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!collaboration) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Partner Not Found" description="This collaboration may no longer be available." url={partnerId ? `/collaborations/${partnerId}` : "/collaborations"} />
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-serif font-bold mb-2 text-foreground">Partner Not Found</h1>
            <p className="text-muted-foreground mb-6">This collaboration may no longer be available.</p>
            <Link
              to="/collaborations"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Back to Collaborations
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const collaborationName = (collaboration as { name?: string })?.name ?? "Partner";
  const collaborationDescription = (collaboration as { description?: string })?.description ?? undefined;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setLightboxIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox('prev');
    if (e.key === 'ArrowRight') navigateLightbox('next');
  };

  // Touch swipe for lightbox (mobile)
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX.current;
    if (delta > 50) navigateLightbox('prev');
    else if (delta < -50) navigateLightbox('next');
  };

  return (
    <div className="min-h-screen bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      <SEO
        title={collaborationName}
        description={collaborationDescription ? `${collaborationDescription.slice(0, 155)}${collaborationDescription.length > 155 ? "…" : ""}` : `${collaborationName} – partner venue in Pune. Premium event collaborations.`}
        url={partnerId ? `/collaborations/${partnerId}` : "/collaborations"}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              to="/collaborations" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Collaborations</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left - Main Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
                {images[0]?.media_type === 'video' && !collaboration.banner_url ? (
                  <video src={images[0].image_url} className="w-full h-full object-cover" controls playsInline />
                ) : (
                  <img
                    src={collaboration.banner_url || images[0]?.image_url || collaboration.logo_url || "/placeholder.svg"}
                    alt={collaboration.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>

              {/* Location Badge */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full 
                            bg-background/90 backdrop-blur-sm">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">{collaboration.location}</span>
              </div>
            </motion.div>

            {/* Right - Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <img
                  src={collaboration.logo_url || "/placeholder.svg"}
                  alt={`${collaboration.name} logo`}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-border"
                />
                <div>
                  <span className="text-sm text-primary font-medium">Partner Venue</span>
                  <h1 className="text-3xl md:text-4xl font-serif font-bold">{collaboration.name}</h1>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {collaboration.description}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-card border border-border/50">
                  <Camera className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{images.length}</div>
                  <div className="text-sm text-muted-foreground">Photos & videos</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-card border border-border/50">
                  <Building2 className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">5★</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to="/contact">
                  <Button size="lg" className="rounded-full px-8">
                    <Phone className="w-4 h-4 mr-2" />
                    Book Through Us
                  </Button>
                </Link>
                {collaboration.map_url && (
                  <a
                    href={collaboration.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="lg" className="rounded-full px-8">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Map
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Venue Gallery – folders and images */}
      {images.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 md:mb-8"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">
                Venue gallery <span className="text-primary">— take a virtual tour</span>
              </h2>
            </motion.div>

            {folderTree.length > 0 || uncategorized.length > 0 ? (
              <GalleryTreeAndContent
                folderTree={folderTree}
                uncategorized={uncategorized}
                images={images}
                onOpenLightbox={openLightbox}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {images.map((image, index) => (
                  <motion.div key={image.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.02 }} className="aspect-square min-h-0">
                    <div className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(index)}>
                      {(image as CollabImage).media_type === 'video' ? (
                        <video src={image.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" playsInline preload="metadata" />
                      ) : (
                        <img src={image.image_url} alt={image.caption || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section – card-style so it doesn’t look like an unfinished strip */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(232,175,193,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] py-10 sm:py-12 px-6 sm:px-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-4 sm:mb-6">
              Ready to Book <span className="text-gradient-gold">{collaboration.name}</span>?
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
              Contact us to get exclusive partner rates and a personalized experience
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-primary text-primary-foreground 
                       font-semibold hover:bg-primary/90 transition-colors text-base"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />

      {/* Lightbox — fullscreen on mobile, swipe to navigate */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Top bar: close + counter */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-6 z-10 bg-gradient-to-b from-black/70 to-transparent">
              <button
                type="button"
                className="p-2 rounded-full text-white/90 hover:bg-white/20 transition-colors"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-sm text-white/80">
                {lightboxIndex + 1} / {images.length}
              </span>
              <div className="w-10" />
            </div>

            {/* Nav arrows — visible on desktop, larger tap targets on mobile */}
            <button
              type="button"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button
              type="button"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            {/* Content: swipeable area, fullscreen on mobile */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col items-center justify-center p-4 pt-16 pb-20 md:max-w-5xl md:max-h-[85vh] md:py-4"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
            >
              {images[lightboxIndex].media_type === 'video' ? (
                <video
                  key={images[lightboxIndex].image_url}
                  src={`${images[lightboxIndex].image_url}${images[lightboxIndex].image_url.includes("?") ? "&" : "?"}cb=1`}
                  className="w-full h-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                />
              ) : (
                <img
                  src={images[lightboxIndex].image_url}
                  alt={images[lightboxIndex].caption || ""}
                  className="w-full h-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg select-none"
                  draggable={false}
                  style={{ touchAction: 'none' }}
                />
              )}
              {(images[lightboxIndex].caption || "").trim() && (
                <p className="text-center mt-3 text-white/90 text-sm md:text-base max-w-lg">
                  {images[lightboxIndex].caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}