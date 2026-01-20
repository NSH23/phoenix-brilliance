import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams, Navigate } from "react-router-dom";
import { 
  Camera, Play, ArrowLeft, ArrowRight, Calendar, X, Heart, Share2, 
  Download, ChevronLeft, ChevronRight, Images, ExternalLink 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { mockEvents, mockAlbums, mockAlbumMedia, AlbumMedia } from "@/data/mockData";

// Extended mock media for demo (since we have limited data)
const generateExtendedMedia = (albumId: string): AlbumMedia[] => {
  const baseMedia = mockAlbumMedia.filter(m => m.albumId === albumId);
  const images = [
    '/wedding 1.jpg', '/gallery wedding.jpg', '/engagement.jpg', 
    '/birthday.jpg', '/sangeet.jpg', '/haldi.jpg', '/mehendi.jpg',
    '/anniversary.jpg', '/coprate.jpg'
  ];
  
  // Generate more media items for demo
  const extended: AlbumMedia[] = [...baseMedia];
  for (let i = 0; i < 12; i++) {
    extended.push({
      id: `generated-${albumId}-${i}`,
      albumId,
      type: 'image',
      url: images[i % images.length],
      caption: `Event moment ${i + 1}`,
      isFeatured: i === 0,
      displayOrder: baseMedia.length + i + 1,
    });
  }
  return extended;
};

const GalleryAlbum = () => {
  const { eventType, albumId } = useParams<{ eventType: string; albumId: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  // Find the event and album
  const event = mockEvents.find(e => e.slug === eventType);
  const album = mockAlbums.find(a => a.id === albumId);

  // Get media for this album (use empty array if no album)
  const allMedia = album ? generateExtendedMedia(album.id) : [];
  const photos = allMedia.filter(m => m.type === 'image');
  const videos = allMedia.filter(m => m.type === 'video');

  // Lightbox navigation
  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    if (lightboxIndex === null) return;
    if (direction === "prev") {
      setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
    } else {
      setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
    }
  }, [lightboxIndex, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") navigateLightbox("prev");
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, navigateLightbox]);

  // If not found, redirect (after all hooks)
  if (!event || !album) {
    return <Navigate to="/gallery" replace />;
  }

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Extract YouTube video ID
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 sm:pt-32 sm:pb-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={album.coverImage}
            alt={album.title}
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap"
          >
            <Link to="/gallery" className="hover:text-primary transition-colors">
              Gallery
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/gallery/${event.slug}`} className="hover:text-primary transition-colors">
              {event.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{album.title}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                           bg-primary/20 text-primary text-sm font-medium mb-4"
                >
                  {event.title}
                </motion.span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
                  {album.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {album.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {new Date(album.eventDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    {photos.length} Photos
                  </span>
                  {videos.length > 0 && (
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary" />
                      {videos.length} Videos
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-full
                                 bg-card border border-border hover:border-primary
                                 transition-colors text-sm font-medium">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-full
                                 bg-primary text-primary-foreground text-sm font-medium
                                 hover:shadow-lg transition-shadow">
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="border-b border-border sticky top-[72px] bg-background/95 backdrop-blur-sm z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative
                        ${activeTab === 'photos' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className="flex items-center gap-2">
                <Images className="w-4 h-4" />
                Photos ({photos.length})
              </span>
              {activeTab === 'photos' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            {videos.length > 0 && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-6 py-4 text-sm font-medium transition-colors relative
                          ${activeTab === 'videos' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Videos ({videos.length})
                </span>
                {activeTab === 'videos' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Media Grid */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          {activeTab === 'photos' ? (
            // Masonry Photo Grid
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="mb-3 sm:mb-4 break-inside-avoid"
                >
                  <div
                    onClick={() => setLightboxIndex(index)}
                    className="group relative cursor-pointer rounded-xl overflow-hidden
                             bg-muted aspect-auto"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Like button */}
                    <button
                      onClick={(e) => toggleLike(photo.id, e)}
                      className={`absolute top-2 right-2 w-9 h-9 rounded-full backdrop-blur-sm
                                flex items-center justify-center transition-all duration-300
                                opacity-0 group-hover:opacity-100
                                ${likedImages.has(photo.id) 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-charcoal/50 text-ivory hover:bg-red-500'}`}
                    >
                      <Heart className={`w-4 h-4 ${likedImages.has(photo.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 right-0 p-3
                                  opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm text-ivory line-clamp-1">{photo.caption}</p>
                    </div>

                    {/* Featured badge */}
                    {photo.isFeatured && (
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full
                                    bg-primary text-primary-foreground text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Videos Grid
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, index) => {
                const youtubeId = video.youtubeUrl ? getYoutubeId(video.youtubeUrl) : null;
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group rounded-xl overflow-hidden bg-card border border-border"
                  >
                    {youtubeId ? (
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title={video.caption}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-medium text-foreground mb-1">{video.caption}</h4>
                      {youtubeId && (
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Back Navigation */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <Link
            to={`/gallery/${event.slug}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {event.title} Albums
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/98 backdrop-blur-xl"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
              <div className="text-ivory">
                <span className="text-ivory/60">{lightboxIndex + 1}</span>
                <span className="mx-2 text-ivory/40">/</span>
                <span className="text-ivory/60">{photos.length}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(photos[lightboxIndex].id); }}
                  className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center 
                            transition-all duration-300 ${
                    likedImages.has(photos[lightboxIndex].id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-ivory/10 text-ivory hover:bg-red-500/80'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedImages.has(photos[lightboxIndex].id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-ivory/20 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="w-10 h-10 rounded-full bg-ivory/10 backdrop-blur-md
                           flex items-center justify-center text-ivory hover:bg-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("prev"); }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 
                       rounded-full bg-ivory/10 backdrop-blur-md flex items-center justify-center 
                       text-ivory hover:bg-primary transition-all duration-300 z-20"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox("next"); }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 
                       rounded-full bg-ivory/10 backdrop-blur-md flex items-center justify-center 
                       text-ivory hover:bg-primary transition-all duration-300 z-20"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {/* Main Image */}
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-16 pt-20 pb-32">
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].caption}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Caption */}
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="text-ivory text-lg">{photos[lightboxIndex].caption}</p>
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-charcoal to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto pb-2 max-w-4xl mx-auto">
                {photos.slice(0, 10).map((photo, idx) => (
                  <button
                    key={photo.id}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden
                              transition-all duration-200 ${
                      idx === lightboxIndex 
                        ? 'ring-2 ring-primary scale-110' 
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {photos.length > 10 && (
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-ivory/10
                                flex items-center justify-center text-ivory text-sm">
                    +{photos.length - 10}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryAlbum;
