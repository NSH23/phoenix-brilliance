import { StackedCardsInteraction } from "@/components/ui/stacked-cards-interaction";

const StackedCardsInteractionDemo = () => {
  return (
    <StackedCardsInteraction
      cards={[
        {
          image:
            "https://images.unsplash.com/photo-1528741254566-d718e868201f?q=80&w=1200&auto=format&fit=crop",
          title: "Curated Wedding Experiences",
          description: "Soft pastel palettes, handcrafted details, and cinematic ambience.",
        },
        {
          image:
            "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?q=80&w=1200&auto=format&fit=crop",
          title: "Design-Led Celebrations",
          description: "Immersive stages, layered lighting, and thoughtfully styled decor.",
        },
        {
          image:
            "https://images.unsplash.com/photo-1526827826797-7b05204a22ef?q=80&w=1200&auto=format&fit=crop",
          title: "Intimate Luxury Moments",
          description: "Emotion-first storytelling for families, brands, and milestones.",
        },
      ]}
    />
  );
};

export { StackedCardsInteractionDemo };

