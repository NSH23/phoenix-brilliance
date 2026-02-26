import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTASection = () => {
  return (
    <section
      id="final-cta"
      className="relative py-20 md:py-28 bg-primary/[0.05] dark:bg-surface overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto"
        >
          <h2
            id="final-cta-heading"
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-foreground mb-4"
          >
            Ready to Create Your <span className="italic text-primary">Perfect Day</span>?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-sans mb-8">
            Let's turn your vision into an unforgettable celebration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="font-sans font-medium h-14 px-8 text-lg rounded-full shadow-warm-lg hover:shadow-warm-xl transition-all duration-300"
              asChild
            >
              <Link to="/contact">
                Plan Your Event
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-sans font-medium h-14 px-8 text-lg rounded-full border-2 border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group"
              asChild
            >
              <Link to="/gallery">
                View Our Work <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
