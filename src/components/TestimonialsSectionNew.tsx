import { TestimonialsSection } from "@/components/ui/testimonials-1";
import { getFeaturedTestimonials } from "@/services/testimonials";
import { useEffect, useState } from "react";

const DEFAULT_TESTIMONIALS = [
  {
    author: {
      name: "Aarav & Meera",
      handle: "Wedding Reception",
      avatar: ""
    },
    text: "Phoenix curated every detail of our wedding with so much heart. The décor, flow, and emotions they created are memories we will cherish forever.",
  },
  {
    author: {
      name: "Riya Sharma",
      handle: "Sangeet & Mehendi",
      avatar: ""
    },
    text: "From our first meeting to the last goodbye, the team handled everything with calm precision. We could truly be present with our families.",
  },
  {
    author: {
      name: "Karan & Diya",
      handle: "Intimate Wedding",
      avatar: ""
    },
    text: "They transformed a simple venue into a dreamscape. Every corner felt intentional and beautifully aligned with our story.",
  },
  {
    author: {
      name: "Rohit Verma",
      handle: "Corporate Gala",
      avatar: ""
    },
    text: "Our corporate gala felt warm, elevated, and absolutely seamless. Guests still talk about the ambience and experience.",
  },
  {
    author: {
      name: "Ishita & Nikhil",
      handle: "Wedding Celebrations",
      avatar: ""
    },
    text: "They balanced traditions and modern design perfectly. The pheras, the décor, the music — everything felt like us.",
  },
  {
    author: {
      name: "Saurabh & Anjali",
      handle: "Destination Wedding",
      avatar: ""
    },
    text: "Planning a destination wedding from abroad was stressful until we found Phoenix. They handled every logistic perfectly.",
  },
];

const TestimonialsSectionWrapper = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFeaturedTestimonials(10)
      .then((data) => {
        if (data && data.length > 0) {
          setTestimonials(
            data.map((t) => ({
              author: {
                name: t.name || "Happy Client",
                handle: t.role || "Client",
                avatar: t.avatar || "",
              },
              text: t.content || "Amazing experience working with Phoenix Events.",
            }))
          );
        } else {
          setTestimonials(DEFAULT_TESTIMONIALS);
        }
      })
      .catch(() => setTestimonials(DEFAULT_TESTIMONIALS))
      .finally(() => setIsLoading(false));
  }, []);

  // Transform data for the new component
  const formattedTestimonials = testimonials.map((t) => ({
    name: t.author.name,
    role: t.author.handle,
    text: t.text,
    avatar: t.author.avatar,
    rating: 5,
  }));

  if (isLoading) {
    return (
      <div className="relative bg-transparent overflow-hidden py-12 md:py-16">
        <div className="relative z-10">
          <section id="testimonials" className="w-full py-0">
            <div className="container px-4 mx-auto max-w-7xl">
              <header className="pl-5 md:pl-6 border-l-4 border-primary mb-8 md:mb-10 space-y-1">
                <div className="h-4 w-24 bg-primary/20 rounded animate-pulse" />
                <div className="h-9 w-72 bg-muted rounded animate-pulse" />
                <div className="mt-4 h-5 max-w-xl bg-muted/60 rounded animate-pulse" />
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border dark:border-white/10 bg-card shadow-elevation-1 dark:shadow-elevation-1-dark p-6 animate-pulse h-48"
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (formattedTestimonials.length === 0) {
    return null;
  }

  return (
      <div className="relative bg-transparent overflow-hidden py-12 md:py-16">
      {/* Light theme only: lgt4.jpg; dark theme: no section background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-[url('/lgt4.jpg')] dark:bg-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-[5] bg-white/35 dark:bg-transparent"
        aria-hidden
      />
      <div className="relative z-10">
        <TestimonialsSection
          title="Kind Words from Our Clients"
          subtitle="Stories from weddings, celebrations, and experiences crafted with heart by Phoenix Events & Production."
          badgeText="Client Love"
          testimonials={formattedTestimonials}
          className="bg-transparent py-0"
        />
      </div>
    </div>
  );
};

export default TestimonialsSectionWrapper;

