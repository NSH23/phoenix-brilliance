import { motion } from "framer-motion";
import { 
  CalendarCheck, 
  Palette, 
  Lightbulb, 
  Music, 
  Camera, 
  Mic2, 
  Building2, 
  Sparkles 
} from "lucide-react";

const services = [
  {
    icon: CalendarCheck,
    title: "Event Planning & Management",
    description: "End-to-end event coordination from concept to execution, ensuring every detail is perfectly orchestrated.",
  },
  {
    icon: Palette,
    title: "Venue Decoration",
    description: "Transform any space into a breathtaking venue with our creative décor solutions and thematic designs.",
  },
  {
    icon: Lightbulb,
    title: "Stage & Lighting",
    description: "Stunning stage setups and professional lighting that create the perfect ambiance for your event.",
  },
  {
    icon: Music,
    title: "Sound & DJ",
    description: "Premium sound systems and talented DJs to keep your guests entertained throughout the celebration.",
  },
  {
    icon: Camera,
    title: "Photography & Videography",
    description: "Capture every precious moment with our professional photographers and cinematographers.",
  },
  {
    icon: Mic2,
    title: "Artist & Anchor Management",
    description: "Access to top performers, anchors, and entertainers to add star power to your events.",
  },
  {
    icon: Building2,
    title: "Corporate Branding Setup",
    description: "Professional branding solutions for corporate events, product launches, and exhibitions.",
  },
  {
    icon: Sparkles,
    title: "Custom Theme Events",
    description: "Unique themed experiences crafted to your imagination – from vintage elegance to modern chic.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-rose-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            What We Offer
          </span>
          <h2 className="section-title mb-4">
            Our <span className="text-gradient-gold">Services</span>
          </h2>
          <p className="section-subtitle">
            Comprehensive event solutions to bring your vision to life with precision, 
            creativity, and unmatched attention to detail.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card h-full p-6 transition-all duration-500
                            hover:shadow-luxury hover:-translate-y-2 hover:border-primary/30">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5
                              group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                  <service.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3 
                             group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>

                {/* Hover Indicator */}
                <div className="mt-4 flex items-center gap-2 text-primary opacity-0 transform translate-x-2
                              group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                  <span className="text-sm font-medium">Learn More</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
