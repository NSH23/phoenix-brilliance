import { motion } from "framer-motion";
import EventCard from "./EventCard";

import weddingImg from "@/assets/wedding-event.jpg";
import birthdayImg from "@/assets/birthday-event.jpg";
import engagementImg from "@/assets/engagement-event.jpg";
import sangeetImg from "@/assets/sangeet-event.jpg";
import haldiImg from "@/assets/haldi-event.jpg";
import mehendiImg from "@/assets/mehendi-event.jpg";
import anniversaryImg from "@/assets/anniversary-event.jpg";
import corporateImg from "@/assets/corporate-event.jpg";
import carOpeningImg from "@/assets/car-opening-event.jpg";

const events = [
  {
    title: "Wedding",
    description: "Transform your dream wedding into reality with our exquisite planning and flawless execution. From intimate ceremonies to grand celebrations, we create magical moments.",
    image: weddingImg,
  },
  {
    title: "Birthday",
    description: "Celebrate another year of life with style! Our birthday events range from elegant soirées to vibrant themed parties that leave lasting impressions.",
    image: birthdayImg,
  },
  {
    title: "Engagement",
    description: "Mark the beginning of your forever with an enchanting engagement ceremony. We create romantic settings that capture the essence of your love story.",
    image: engagementImg,
  },
  {
    title: "Sangeet",
    description: "Experience the joy of dance and music with our spectacular Sangeet nights. We blend traditional charm with modern entertainment for unforgettable celebrations.",
    image: sangeetImg,
  },
  {
    title: "Haldi",
    description: "Embrace tradition with our beautifully curated Haldi ceremonies. Vibrant décor, traditional elements, and joyful ambiance create the perfect blessing.",
    image: haldiImg,
  },
  {
    title: "Mehendi",
    description: "Celebrate the art of Mehendi with our colorful and culturally rich setups. Traditional cushions, ambient lighting, and artistic décor set the perfect scene.",
    image: mehendiImg,
  },
  {
    title: "Anniversary",
    description: "Rekindle romance and celebrate milestones with our intimate anniversary celebrations. From candlelit dinners to grand parties, we make memories.",
    image: anniversaryImg,
  },
  {
    title: "Corporate Events",
    description: "Elevate your brand with our professional corporate event management. Product launches, conferences, and gala dinners executed with precision.",
    image: corporateImg,
  },
  {
    title: "Car Opening",
    description: "Launch your automotive showcase with glamour and sophistication. Red carpet events, VIP experiences, and stunning presentations that captivate.",
    image: carOpeningImg,
  },
];

const EventsSection = () => {
  return (
    <section id="events" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-56 sm:w-80 h-56 sm:h-80 bg-rose-gold/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Expertise
          </span>
          <h2 className="section-title mb-4">
            Events We <span className="text-gradient-gold">Create</span>
          </h2>
          <p className="section-subtitle">
            From intimate gatherings to grand celebrations, we specialize in crafting 
            unforgettable experiences tailored to your vision.
          </p>
        </motion.div>

        {/* Events Grid - Improved Mobile Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {events.map((event, index) => (
            <EventCard
              key={event.title}
              title={event.title}
              description={event.description}
              image={event.image}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
