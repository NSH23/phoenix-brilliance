import { TestimonialsSection } from "@/components/ui/testimonials-1";
import HomeSectionShell from "@/components/ui/home-section-shell";
import HomeSectionSplitTitle from "@/components/ui/home-section-split-title";
import { getFeaturedTestimonials } from "@/services/testimonials";
import type { Testimonial } from "@/services/testimonials";
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

type TestimonialsSectionNewProps = {
  prefetchedTestimonials?: Testimonial[];
  homepageDataPending?: boolean;
};

const TestimonialsSectionWrapper = ({
  prefetchedTestimonials,
  homepageDataPending,
}: TestimonialsSectionNewProps = {}) => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (homepageDataPending) return;

    if (prefetchedTestimonials !== undefined) {
      if (prefetchedTestimonials.length > 0) {
        setTestimonials(
          prefetchedTestimonials.map((t) => ({
            author: {
              name: t.name || "Happy Client",
              handle: t.role || "Client",
              avatar: t.avatar_url || "",
            },
            text: t.content || "Amazing experience working with Phoenix Events.",
          }))
        );
      } else {
        setTestimonials(DEFAULT_TESTIMONIALS);
      }
      setIsLoading(false);
      return;
    }

    getFeaturedTestimonials(10)
      .then((data) => {
        if (data && data.length > 0) {
          setTestimonials(
            data.map((t) => ({
              author: {
                name: t.name || "Happy Client",
                handle: t.role || "Client",
                avatar: t.avatar_url || "",
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
  }, [homepageDataPending, prefetchedTestimonials]);

  const formattedTestimonials = testimonials.map((t) => ({
    name: t.author.name,
    role: t.author.handle,
    text: t.text,
    avatar: t.author.avatar,
    rating: 5,
  }));

  if (isLoading) {
    return (
      <HomeSectionShell
        ariaLabelledBy="testimonials-heading"
        badge="Client Love"
        title={<HomeSectionSplitTitle line1="Kind Words" accent="From Our Clients" />}
        fullBleed
        contentPanel
        contentPanelClassName="p-6 md:p-8"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-border bg-muted/40 dark:border-white/10"
            />
          ))}
        </div>
      </HomeSectionShell>
    );
  }

  if (formattedTestimonials.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell
      ariaLabelledBy="testimonials-heading"
      badge="Client Love"
      title={<HomeSectionSplitTitle line1="Kind Words" accent="From Our Clients" />}
      fullBleed
      contentPanel
      contentPanelClassName="p-4 sm:p-5 md:p-6 lg:p-8"
      contentClassName="pb-2 pt-2 md:pb-4 md:pt-4"
    >
      <TestimonialsSection
        testimonials={formattedTestimonials}
        showHeader={false}
        embedded
        className="bg-transparent py-0"
      />
    </HomeSectionShell>
  );
};

export default TestimonialsSectionWrapper;
