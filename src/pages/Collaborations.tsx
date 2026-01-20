import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Building2, Handshake, Star, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { mockCollaborations } from "@/data/mockData";

const stats = [
  { icon: Building2, value: "25+", label: "Partner Venues" },
  { icon: Handshake, value: "100+", label: "Events Together" },
  { icon: Star, value: "5★", label: "Partner Rating" },
  { icon: Users, value: "50K+", label: "Happy Guests" },
];

export default function Collaborations() {
  const activeCollaborations = mockCollaborations.filter(c => c.isActive);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Our Network
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Trusted <span className="text-gradient-gold">Collaborations</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
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
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Our <span className="text-gradient-gold">Partners</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our network of premium venues and trusted vendors
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCollaborations.map((collab, index) => (
              <motion.div
                key={collab.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/collaborations/${collab.id}`}>
                  <div className="group relative rounded-3xl overflow-hidden bg-card border border-border/50 
                                hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 
                                transition-all duration-500">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={collab.images[0]?.imageUrl || collab.logoUrl}
                        alt={collab.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                      
                      {/* Location Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full 
                                    bg-background/80 backdrop-blur-sm text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{collab.location}</span>
                      </div>

                      {/* Stats Badge */}
                      {collab.images.length > 0 && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full 
                                      bg-primary/90 backdrop-blur-sm text-primary-foreground text-sm font-medium">
                          {collab.images.length} Photos
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={collab.logoUrl}
                          alt={`${collab.name} logo`}
                          className="w-12 h-12 rounded-xl object-cover border border-border/50"
                        />
                        <div>
                          <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary 
                                       transition-colors duration-300">
                            {collab.name}
                          </h3>
                          {collab.steps.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {collab.steps.length} step booking process
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {collab.description}
                      </p>

                      <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
              Want to <span className="text-gradient-gold">Partner</span> With Us?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join our network of premium venues and vendors. Let's create magical moments together.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground 
                       font-semibold hover:bg-primary/90 transition-colors"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}