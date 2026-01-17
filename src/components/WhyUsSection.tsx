import { motion } from "framer-motion";
import { Trophy, Heart, Users, Shield, Star } from "lucide-react";

const stats = [
  {
    icon: Trophy,
    value: "100+",
    label: "Successful Events",
    description: "Flawlessly executed celebrations",
  },
  {
    icon: Heart,
    value: "50+",
    label: "Happy Couples",
    description: "Dream weddings brought to life",
  },
  {
    icon: Users,
    value: "25+",
    label: "Trusted Vendors",
    description: "Premium partner network",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Quality Assurance",
    description: "Commitment to excellence",
  },
];

const reasons = [
  "Custom Themes Tailored to Your Vision",
  "End-to-End Event Execution",
  "Premium Vendor Network",
  "Transparent Pricing",
  "24/7 Event Support",
  "Post-Event Services",
];

const WhyUsSection = () => {
  return (
    <section id="why-us" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald/5 rounded-full blur-3xl" />
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
            Why Choose Us
          </span>
          <h2 className="section-title mb-4">
            Why <span className="text-gradient-gold">Phoenix Events?</span>
          </h2>
          <p className="section-subtitle">
            We don't just plan events – we create experiences that become 
            cherished memories for a lifetime.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card p-6 text-center h-full transition-all duration-500
                            hover:shadow-luxury hover:-translate-y-2">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4
                              group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                  <stat.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Value */}
                <motion.div
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className="font-serif text-4xl md:text-5xl font-bold text-gradient-gold mb-2"
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <h3 className="font-semibold text-foreground mb-1">{stat.label}</h3>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reasons List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card p-8 md:p-12">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
              What Sets Us Apart
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reasons.map((reason, index) => (
                <motion.div
                  key={reason}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyUsSection;
