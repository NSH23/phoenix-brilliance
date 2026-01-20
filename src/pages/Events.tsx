import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Sparkles, Users, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { mockEvents, mockAlbums, mockTestimonials } from "@/data/mockData";

const Events = () => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Get active events
  const activeEvents = mockEvents.filter(event => event.isActive);

  // Stats
  const totalEvents = activeEvents.length;
  const totalAlbums = mockAlbums.length;
  const happyClients = mockTestimonials.length * 50; // Mock number

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-rose-gold/10 rounded-full blur-[120px]" />
        </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
                       bg-gradient-to-r from-primary/20 to-rose-gold/20 
                       border border-primary/30 backdrop-blur-sm mb-6"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Our Events</span>
            </motion.span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Events We <span className="text-gradient-gold">Celebrate</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              From intimate gatherings to grand celebrations, we bring your vision to life with meticulous planning and flawless execution.
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center gap-8 sm:gap-16"
            >
              {[
                { value: `${totalEvents}+`, label: "Event Types", icon: Calendar },
                { value: `${totalAlbums}+`, label: "Events Completed", icon: Sparkles },
                { value: `${happyClients}+`, label: "Happy Clients", icon: Users },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-primary">{stat.value}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Choose Your <span className="text-gradient-gold">Celebration</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click on any event type to explore our process and see how we make magic happen
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeEvents.map((event, index) => {
              const albumCount = mockAlbums.filter(a => a.eventId === event.id).length;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <Link
                    to={`/events/${event.slug}`}
                    className="group block relative rounded-2xl overflow-hidden aspect-[4/5]
                             bg-card border border-border hover:border-primary/50
                             transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className={`w-full h-full object-cover transition-all duration-700
                                  ${hoveredEvent === event.id ? 'scale-110 brightness-75' : 'scale-100 brightness-90'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      {/* Badge */}
                      {event.steps.length > 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5
                                      bg-primary/90 rounded-full text-xs font-medium text-primary-foreground">
                          <Star className="w-3.5 h-3.5" />
                          {event.steps.length} Step Process
                        </div>
                      )}

                      {/* Title & Description */}
                      <motion.div
                        initial={false}
                        animate={{ y: hoveredEvent === event.id ? -10 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ivory mb-2">
                          {event.title}
                        </h3>
                        <p className="text-ivory/80 text-sm mb-3 line-clamp-2">
                          {event.shortDescription}
                        </p>
                        
                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-ivory/60">
                          {albumCount > 0 && (
                            <span>{albumCount} Albums</span>
                          )}
                          {event.steps.length > 0 && (
                            <span>View Process →</span>
                          )}
                        </div>
                      </motion.div>

                      {/* Hover Arrow */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: hoveredEvent === event.id ? 1 : 0,
                          x: hoveredEvent === event.id ? 0 : -20
                        }}
                        className="absolute bottom-6 right-6"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center
                                      shadow-lg shadow-primary/30">
                          <ArrowRight className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Corner Decorations */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/50 
                                  rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/50 
                                  rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Don't See Your Event? <span className="text-gradient-gold">Let's Talk!</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              We specialize in creating custom experiences for any occasion. Share your vision with us.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full
                       bg-primary text-primary-foreground font-semibold
                       hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Events;
