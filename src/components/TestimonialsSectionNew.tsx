import { TestimonialsSection } from "@/components/ui/testimonials-1";
import { getFeaturedTestimonials } from "@/services/testimonials";
import { useEffect, useState } from "react";

const DEFAULT_TESTIMONIALS = [
  {
    author: {
      name: "Aarav & Meera",
      handle: "Wedding Reception",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
    },
    text: "Phoenix curated every detail of our wedding with so much heart. The décor, flow, and emotions they created are memories we will cherish forever.",
  },
  {
    author: {
      name: "Riya Sharma",
      handle: "Sangeet & Mehendi",
      avatar: "https://images.unsplash.com/photo-1524504388940-1e4fd709849c?q=80&w=600&auto=format&fit=crop"
    },
    text: "From our first meeting to the last goodbye, the team handled everything with calm precision. We could truly be present with our families.",
  },
  {
    author: {
      name: "Karan & Diya",
      handle: "Intimate Wedding",
      avatar: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?q=80&w=600&auto=format&fit=crop"
    },
    text: "They transformed a simple venue into a dreamscape. Every corner felt intentional and beautifully aligned with our story.",
  },
  {
    author: {
      name: "Rohit Verma",
      handle: "Corporate Gala",
      avatar: "https://images.unsplash.com/photo-1525130413817-d45c1d127c42?q=80&w=600&auto=format&fit=crop"
    },
    text: "Our corporate gala felt warm, elevated, and absolutely seamless. Guests still talk about the ambience and experience.",
  },
  {
    author: {
      name: "Ishita & Nikhil",
      handle: "Wedding Celebrations",
      avatar: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop"
    },
    text: "They balanced traditions and modern design perfectly. The pheras, the décor, the music — everything felt like us.",
  },
  {
    author: {
      name: "Saurabh & Anjali",
      handle: "Destination Wedding",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop"
    },
    text: "Planning a destination wedding from abroad was stressful until we found Phoenix. They handled every logistic perfectly.",
  },
];

const TestimonialsSectionWrapper = () => {
  const [testimonials, setTestimonials] = useState<any[]>(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    // Optional: Fetch testimonials if needed, matching the format
    getFeaturedTestimonials(10).then(data => {
      if (data && data.length > 0) {
        setTestimonials(data.map(t => ({
          author: {
            name: t.name || "Happy Client",
            handle: t.role || "Client",
            avatar: t.avatar || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop"
          },
          text: t.content || "Amazing experience working with Phoenix Events."
        })));
      }
    }).catch(err => console.error(err));
  }, []);

  // Transform data for the new component
  const formattedTestimonials = testimonials.map(t => ({
    name: t.author.name,
    role: t.author.handle,
    text: t.text,
    avatar: t.author.avatar,
    rating: 5 // Default rating
  }));

  return (
    <div className="relative bg-background dark:bg-navy overflow-hidden">
      <div className="relative z-10">
        <TestimonialsSection
          title="Kind Words from Our Clients"
          subtitle="Stories from weddings, celebrations, and experiences crafted with heart by Phoenix Events & Production."
          badgeText="Client Love"
          testimonials={formattedTestimonials}
          className="bg-transparent"
        />
      </div>
    </div>
  );
};

export default TestimonialsSectionWrapper;

