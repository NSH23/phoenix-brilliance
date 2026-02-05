import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ArrowLeft, ArrowRight, ExternalLink, Phone, X, ChevronLeft, ChevronRight,
  CheckCircle, Building2, Camera, ClipboardList, Loader2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getCollaborationById } from "@/services/collaborations";
import { Button } from "@/components/ui/button";

type CollaborationDetail = Awaited<ReturnType<typeof getCollaborationById>>;
type CollabImage = { id: string; image_url: string; caption: string | null };
type CollabStep = { id: string; step_number: number; title: string; description: string | null };

export default function CollaborationDetail() {
  const { partnerId } = useParams();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [collaboration, setCollaboration] = useState<CollaborationDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Partner Not Found</h1>
          <Link to="/collaborations" className="text-primary hover:underline">
            Back to Collaborations
          </Link>
        </div>
      </div>
    );
  }

  const images: CollabImage[] = (collaboration as any)?.collaboration_images || [];
  const steps: CollabStep[] = ((collaboration as any)?.collaboration_steps || []).sort((a: CollabStep, b: CollabStep) => a.step_number - b.step_number);

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

  return (
    <div className="min-h-screen bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
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
                <img
                  src={images[0]?.image_url || collaboration.logo_url || "/placeholder.svg"}
                  alt={collaboration.name}
                  className="w-full h-full object-cover"
                />
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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-card border border-border/50">
                  <Camera className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{images.length}</div>
                  <div className="text-sm text-muted-foreground">Photos</div>
                </div>
                <div className="text-center p-4 rounded-2xl bg-card border border-border/50">
                  <ClipboardList className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{steps.length}</div>
                  <div className="text-sm text-muted-foreground">Booking Steps</div>
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

      {/* Booking Process Timeline */}
      {steps.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                How It Works
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Booking <span className="text-gradient-gold">Process</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Book this venue through Phoenix Events and get exclusive benefits
              </p>
            </motion.div>

            {/* Timeline */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />
                
                {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 }}
                      className={`relative flex items-start gap-8 mb-12 last:mb-0 
                                ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      {/* Step Number Circle */}
                      <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.15 + 0.2, type: "spring" }}
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 
                                   flex items-center justify-center shadow-lg shadow-primary/30"
                        >
                          <span className="text-2xl font-bold text-primary-foreground">
                            {step.step_number}
                          </span>
                        </motion.div>
                      </div>

                      {/* Content Card */}
                      <div className={`flex-1 pl-24 md:pl-0 ${index % 2 === 0 ? 'md:pr-24 md:text-right' : 'md:pl-24'}`}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-6 rounded-2xl bg-card border border-border/50 
                                   hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                        >
                          <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                            <CheckCircle className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-serif font-bold">{step.title}</h3>
                          </div>
                          <p className="text-muted-foreground">{step.description || ""}</p>
                        </motion.div>
                      </div>

                      {/* Spacer for alternating layout */}
                      <div className="hidden md:block flex-1" />
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Venue Gallery */}
      {images.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Explore
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Venue <span className="text-gradient-gold">Gallery</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Take a virtual tour of this stunning venue
              </p>
            </motion.div>

            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="break-inside-avoid"
                >
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.caption || ""}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 
                                  transition-transform duration-300">
                      <p className="text-foreground font-medium">{image.caption || ""}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Ready to Book <span className="text-gradient-gold">{collaboration.name}</span>?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contact us to get exclusive partner rates and a personalized experience
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground 
                       font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 p-3 rounded-full bg-card/50 hover:bg-card transition-colors z-10"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
              className="absolute left-4 md:left-8 p-3 rounded-full bg-card/50 hover:bg-card transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              className="absolute right-4 md:right-8 p-3 rounded-full bg-card/50 hover:bg-card transition-colors"
              onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex].image_url}
                alt={images[lightboxIndex].caption || ""}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <p className="text-center mt-4 text-foreground">
                {images[lightboxIndex].caption || ""}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}