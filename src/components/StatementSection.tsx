import { motion } from "framer-motion";

/** Large centered text block - Spoils Trophy style statement about the brand */
const StatementSection = () => {
  return (
    <section id="statement" className="relative py-20 sm:py-28 bg-charcoal overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center text-ivory/95 text-body-lg sm:text-xl md:text-2xl font-medium leading-body-relaxed"
        >
          Phoenix Brilliance is your trusted partner in creating extraordinary events. From intimate
          weddings to grand corporate celebrations, we bring vision to life with precision, elegance,
          and unwavering attention to detail. Every moment deserves to be unforgettable.
        </motion.p>
      </div>
    </section>
  );
};

export default StatementSection;
