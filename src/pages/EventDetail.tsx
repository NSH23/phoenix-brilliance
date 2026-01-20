import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useParams, Navigate } from "react-router-dom";
import { 
  ArrowLeft, ArrowRight, Calendar, Camera, Play, Star, 
  MessageCircle, MapPin, Palette, Users, CheckCircle, Sparkles,
  ClipboardList, PartyPopper, Cake, Target, FileText, Settings, Award
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { mockEvents, mockAlbums, mockTestimonials } from "@/data/mockData";

// Icon mapping for steps
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle, MapPin, Palette, Users, CheckCircle, Star, Sparkles,
  ClipboardList, PartyPopper, Cake, Target, FileText, Settings, Award, Calendar
};

const EventDetail = () => {
  const { eventType } = useParams<{ eventType: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });

  // Find the event
  const event = mockEvents.find(e => e.slug === eventType);

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  // Get related albums
  const relatedAlbums = mockAlbums.filter(album => album.eventId === event.id).slice(0, 3);

  // Get testimonials for this event type
  const eventTestimonials = mockTestimonials.filter(
    t => t.eventType.toLowerCase() === event.title.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pb-12 pt-32">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground 
                       hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Events
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                       bg-primary/20 backdrop-blur-sm text-primary text-sm font-medium mb-4"
            >
              <Calendar className="w-4 h-4" />
              Event Type
            </motion.span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 text-foreground">
              {event.title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              {event.description}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-6 mt-8">
              {event.steps.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{event.steps.length}-Step Process</span>
                </div>
              )}
              {relatedAlbums.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">{relatedAlbums.length} Albums</span>
                </div>
              )}
              <Link
                to="/contact"
                className="ml-auto flex items-center gap-2 px-6 py-3 rounded-full
                         bg-primary text-primary-foreground font-medium
                         hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process/Roadmap Section */}
      {event.steps.length > 0 && (
        <section ref={timelineRef} className="py-16 sm:py-24 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
            <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-rose-gold/5 rounded-full blur-[80px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.span 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
                         bg-gradient-to-r from-primary/20 to-rose-gold/20 
                         border border-primary/30 backdrop-blur-sm mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Our Process</span>
              </motion.span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">
                How We Create Your <span className="text-gradient-gold">{event.title}</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow our proven step-by-step process that ensures every detail is perfect
              </p>
            </motion.div>

            {/* Timeline */}
            <div className="relative max-w-5xl mx-auto">
              {/* Vertical Line - Desktop */}
              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2">
                <motion.div
                  className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-rose-gold"
                  style={{ 
                    height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
                  }}
                />
              </div>

              {/* Vertical Line - Mobile */}
              <div className="lg:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-border">
                <motion.div
                  className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-rose-gold"
                  style={{ 
                    height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
                  }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-12 lg:space-y-24">
                {event.steps.map((step, index) => {
                  const IconComponent = iconMap[step.icon] || CheckCircle;
                  const isLeft = index % 2 === 0;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`relative flex items-start lg:items-center gap-6 lg:gap-0 
                                ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                      onMouseEnter={() => setActiveStep(index)}
                    >
                      {/* Mobile: Icon on left */}
                      <div className="lg:hidden flex-shrink-0 relative z-10">
                        <motion.div
                          animate={{ 
                            scale: activeStep === index ? 1.1 : 1,
                            boxShadow: activeStep === index 
                              ? "0 0 30px rgba(var(--primary), 0.4)" 
                              : "0 0 0 rgba(var(--primary), 0)"
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center
                                    ${activeStep === index 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-card border-2 border-primary/30 text-primary'}`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </motion.div>
                      </div>

                      {/* Content Card */}
                      <div className={`flex-1 lg:w-[calc(50%-3rem)] ${isLeft ? 'lg:pr-12' : 'lg:pl-12'}`}>
                        <motion.div
                          whileHover={{ y: -5 }}
                          className={`bg-card rounded-2xl p-6 sm:p-8 border border-border
                                    hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5
                                    transition-all duration-300 ${activeStep === index ? 'border-primary/50' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="hidden lg:flex w-14 h-14 rounded-xl bg-primary/10 
                                          items-center justify-center flex-shrink-0">
                              <IconComponent className="w-7 h-7 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 
                                               rounded-full bg-primary text-primary-foreground 
                                               text-sm font-bold">
                                  {step.stepNumber}
                                </span>
                                <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                                  {step.title}
                                </h3>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Desktop: Center Circle */}
                      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: activeStep === index ? 1.2 : 1,
                            boxShadow: activeStep === index 
                              ? "0 0 40px rgba(var(--primary), 0.5)" 
                              : "0 0 0 rgba(var(--primary), 0)"
                          }}
                          className={`w-16 h-16 rounded-full flex items-center justify-center
                                    transition-colors duration-300
                                    ${activeStep === index 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-card border-2 border-primary/30 text-primary'}`}
                        >
                          <IconComponent className="w-7 h-7" />
                        </motion.div>
                      </div>

                      {/* Empty space for alternating layout */}
                      <div className="hidden lg:block lg:w-[calc(50%-3rem)]" />
                    </motion.div>
                  );
                })}
              </div>

              {/* End marker */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative flex justify-center mt-16"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-rose-gold
                              flex items-center justify-center shadow-xl shadow-primary/30">
                  <Star className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Related Albums Section */}
      {relatedAlbums.length > 0 && (
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12"
            >
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
                  {event.title} <span className="text-gradient-gold">Albums</span>
                </h2>
                <p className="text-muted-foreground">Browse our {event.title.toLowerCase()} event galleries</p>
              </div>
              <Link
                to={`/gallery/${event.slug}`}
                className="hidden sm:flex items-center gap-2 text-primary hover:underline"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedAlbums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/gallery/${event.slug}/${album.id}`}
                    className="group block bg-card rounded-2xl overflow-hidden border border-border
                             hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 
                                    bg-charcoal/60 backdrop-blur-sm rounded-full text-xs text-ivory">
                        <Camera className="w-3.5 h-3.5" />
                        {album.mediaCount}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-lg font-bold text-foreground mb-1 
                                   group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {album.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                to={`/gallery/${event.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                         bg-primary text-primary-foreground font-medium"
              >
                View All Albums <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {eventTestimonials.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                What Our Clients <span className="text-gradient-gold">Say</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {eventTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 via-background to-rose-gold/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Ready to Plan Your <span className="text-gradient-gold">{event.title}?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Let's create something extraordinary together. Contact us to start planning your perfect event.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                         bg-primary text-primary-foreground font-semibold
                         hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                Start Planning <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={`/gallery/${event.slug}`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                         bg-card border border-border text-foreground font-semibold
                         hover:border-primary transition-all duration-300"
              >
                <Camera className="w-5 h-5" />
                View Gallery
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default EventDetail;
