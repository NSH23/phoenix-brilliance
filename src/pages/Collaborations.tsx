import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, ArrowRight, Building2, Handshake, Star, Users, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getActiveCollaborations } from "@/services/collaborations";
import { getPageHeroContent } from "@/services/pageHeroContent";

const DEFAULT_STATS = [
  { icon: Building2, value: "25+", label: "Partner Venues" },
  { icon: Handshake, value: "100+", label: "Events Together" },
  { icon: Star, value: "5★", label: "Partner Rating" },
  { icon: Users, value: "50K+", label: "Happy Guests" },
];

export default function Collaborations() {
  const [activeCollaborations, setActiveCollaborations] = useState<Awaited<ReturnType<typeof getActiveCollaborations>>>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [heroContent, setHeroContent] = useState<Awaited<ReturnType<typeof getPageHeroContent>> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    Promise.all([
      getActiveCollaborations(),
      getPageHeroContent('collaborations').catch(() => null)
    ])
      .then(([collabs, hero]) => {
        setActiveCollaborations(collabs);
        setHeroContent(hero);
      })
      .catch(() => {
        setActiveCollaborations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - elegant abstract gradient mesh */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[60vh] flex items-center">
        {/* Abstract gradient mesh background */}
        <div className="absolute inset-0 collaborations-page-mesh-bg" aria-hidden />
        {!prefersReducedMotion && (
          <>
            {/* Purple gradient mesh for light theme - smooth elegant movement */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-60" : "opacity-70"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 25% 35%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 65% 25%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 75% 55%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 45% 75%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 60%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 35%, rgba(183, 110, 121, 0.25) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 30% 35%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 105% 115% at 60% 60%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 100% 120% at 90% 80%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 110% 110% at 70% 50%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 115% 105% at 40% 25%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 10% 20%, rgba(139, 92, 246, 0.32) 0%, transparent 65%)",
                    ],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {/* Indigo blue layer */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-50" : "opacity-65"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 70% 25%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 35% 70%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 15% 45%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 55% 15%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 65%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 25%, rgba(247, 231, 206, 0.2) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 115% 120% at 60% 30%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 130% 100% at 20% 85%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 120% 115% at 45% 70%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 110% 120% at 55% 45%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 105% 125% at 75% 20%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                      "radial-gradient(ellipse 100% 130% at 80% 15%, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
                    ],
              }}
              transition={{ duration: 24, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 3 }}
            />
            {/* Purple layer */}
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-35" : "opacity-60"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(183, 110, 121, 0.15) 0%, transparent 60%)",
                      "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(247, 231, 206, 0.12) 0%, transparent 60%)",
                      "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(183, 110, 121, 0.15) 0%, transparent 60%)",
                    ]
                  : [
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 50% 50%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 110% 130% at 65% 35%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 120% 120% at 85% 85%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 115% 125% at 25% 40%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 125% 115% at 70% 75%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                      "radial-gradient(ellipse 130% 110% at 35% 65%, rgba(168, 85, 247, 0.24) 0%, transparent 75%)",
                    ],
              }}
              transition={{ duration: 28, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 6 }}
            />
            {/* Cyan/blue accent for light theme - smooth elegant movement */}
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 110% 115% at 40% 25%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 120% 100% at 75% 90%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 115% 105% at 60% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 110% 110% at 45% 55%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 105% 115% at 30% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                    "radial-gradient(ellipse 100% 120% at 25% 10%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
                  ],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 1.5 }}
              />
            )}
            {/* Gold accent for light theme - smooth elegant movement */}
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-35"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 95% 105% at 25% 35%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 100% 90% at 95% 55%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 105% 95% at 70% 70%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 110% 110% at 50% 5%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 100% 100% at 15% 60%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                    "radial-gradient(ellipse 90% 100% at 5% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%)",
                  ],
                }}
                transition={{ duration: 26, repeat: Infinity, ease: [0.25, 0.1, 0.25, 1], delay: 4 }}
              />
            )}
          </>
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="typography-eyebrow inline-block text-primary mb-4"
            >
              {heroContent?.title || "Our Network"}
            </motion.span>
            <h1 className={`typography-hero mb-6 ${isDark ? "text-white" : "text-foreground"}`}>
              {heroContent?.subtitle ? (
                (() => {
                  const words = heroContent.subtitle.split(' ');
                  const lastWord = words[words.length - 1];
                  const restWords = words.slice(0, -1).join(' ');
                  return (
                    <>
                      {restWords}{restWords && ' '}
                      <span className="text-gradient-gold">{lastWord}</span>
                    </>
                  );
                })()
              ) : (
                <>
                  Trusted <span className="text-gradient-gold">Collaborations</span>
                </>
              )}
            </h1>
            <p className={`typography-body-lg max-w-2xl mx-auto ${isDark ? "text-white/90" : "text-muted-foreground"}`}>
              {heroContent?.description || "We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions."}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 max-w-4xl mx-auto"
          >
            {(heroContent?.stats && heroContent.stats.length >= 3
              ? heroContent.stats.map((stat, index) => ({
                  icon: DEFAULT_STATS[index]?.icon || Building2,
                  value: stat.value,
                  label: stat.label,
                }))
              : DEFAULT_STATS
            ).map((stat, index) => (
              <motion.div
                key={`${stat.label}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card/90 dark:bg-card/95 backdrop-blur-xl 
                           border border-border/80 dark:border-border
                           shadow-[0_8px_32px_rgba(26,26,46,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                           hover:border-primary/20 dark:hover:border-primary/30 transition-colors duration-300"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className={`text-3xl md:text-4xl font-serif font-bold mb-1 ${isDark ? "text-white" : "text-foreground"}`}>
                  {stat.value}
                </div>
                <div className={`text-sm ${isDark ? "text-white/70" : "text-muted-foreground"}`}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        {/* Smooth merge: hero fades gently into background (theme-aware) */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-[1] hero-merge-gradient"
          style={{
            height: "clamp(180px, 28vh, 280px)",
          }}
          aria-hidden
        />
      </section>

      {/* Partners Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="typography-section mb-4">
              Our <span className="text-gradient-gold">Partners</span>
            </h2>
            <p className="typography-body-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our network of premium venues and trusted vendors
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {activeCollaborations.map((collab, index) => {
              const hasLogo = !!collab.logo_url;
              
              return (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link 
                  to={`/collaborations/${collab.id}`}
                  className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="group/card relative h-full rounded-[20px] overflow-hidden bg-card border border-border/60 
                                hover:border-primary/20 dark:hover:border-primary/30
                                shadow-[0_4px_24px_rgba(26,26,46,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                                hover:shadow-[0_24px_56px_rgba(26,26,46,0.12)] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.25)]
                                hover:-translate-y-2
                                transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]">
                    {/* Card header - show logo in circle if present, otherwise show name prominently */}
                    <div className={`relative ${hasLogo ? 'h-48' : 'h-40'} overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10`}>
                      {hasLogo ? (
                        <>
                          {/* Decorative background pattern when logo exists */}
                          <div className="absolute inset-0 opacity-5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full blur-2xl" />
                          </div>
                          {/* Logo displayed in center as circular avatar */}
                          <div className="absolute inset-0 flex items-center justify-center p-6">
                            <div className="relative w-28 h-28 rounded-full bg-background/80 backdrop-blur-sm border-4 border-primary/20 
                                          shadow-xl group-hover/card:border-primary/40 group-hover/card:scale-105 
                                          transition-all duration-400 flex items-center justify-center overflow-hidden">
                              <img
                                src={collab.logo_url}
                                alt={`${collab.name} logo`}
                                className="w-full h-full object-contain p-3"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        /* When no logo, show name prominently */
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                          <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground group-hover/card:text-primary 
                                       transition-colors duration-300 text-center line-clamp-2">
                            {collab.name}
                          </h3>
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6">
                      {/* Name below logo (if logo exists) */}
                      {hasLogo && (
                        <div className="mb-3">
                          <h3 className="text-lg font-serif font-bold text-foreground group-hover/card:text-primary 
                                       transition-colors duration-300 text-center line-clamp-2">
                            {collab.name}
                          </h3>
                        </div>
                      )}

                      {/* Location badge - positioned below name/logo, above description */}
                      {collab.location && (
                        <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg 
                                      bg-muted/50 dark:bg-muted/30 border border-border/50">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                            {collab.location}
                          </p>
                        </div>
                      )}

                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4 text-center min-h-[3.75rem]">
                        {collab.description || "—"}
                      </p>

                      <div className="flex items-center justify-center text-primary font-semibold text-sm 
                                     group-hover/card:gap-3 gap-2 transition-all duration-300">
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4 group-hover/card:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )})}
          </div>
          )}
        </div>
      </section>

      {/* CTA Section – gradient mesh, echoes hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 collaborations-cta-mesh-bg" aria-hidden />
        {!prefersReducedMotion && (
          <>
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-40" : "opacity-65"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 30% 40%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 60% 70%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 30%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 30% 40%, rgba(183, 110, 121, 0.15) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 100% 120% at 30% 40%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 120% 100% at 60% 70%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 110% 110% at 70% 30%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                      "radial-gradient(ellipse 100% 120% at 30% 40%, rgba(139, 92, 246, 0.28) 0%, transparent 65%)",
                    ],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
            />
            <motion.div
              className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-30" : "opacity-55"}`}
              aria-hidden
              animate={{
                background: isDark
                  ? [
                      "radial-gradient(circle at 70% 60%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 40% 25%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 25% 65%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                      "radial-gradient(circle at 70% 60%, rgba(247, 231, 206, 0.12) 0%, transparent 50%)",
                    ]
                  : [
                      "radial-gradient(ellipse 110% 120% at 70% 60%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 120% 110% at 40% 25%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 100% 130% at 25% 65%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                      "radial-gradient(ellipse 110% 120% at 70% 60%, rgba(99, 102, 241, 0.24) 0%, transparent 70%)",
                    ],
              }}
              transition={{ duration: 14, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 2 }}
            />
            {!isDark && (
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-45"
                aria-hidden
                animate={{
                  background: [
                    "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
                    "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(59, 130, 246, 0.18) 0%, transparent 70%)",
                    "radial-gradient(ellipse 100% 120% at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
                  ],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: 4 }}
              />
            )}
          </>
        )}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <h2 className={`typography-section mb-6 ${isDark ? "text-white" : "text-foreground"}`}>
            Want to <span className="text-gradient-gold">Partner</span> With Us?
          </h2>
          <p className={`typography-body-lg mb-8 ${isDark ? "text-white/90" : "text-muted-foreground"}`}>
            Join our network of premium venues and vendors. Let's create magical moments together.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground 
                     font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Become a Partner
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}