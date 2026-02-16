/**
 * Animated separator between sections — subtle gradient line with optional glow.
 * Keeps breathing space; luxury requires whitespace.
 */
export default function SectionSeparator() {
  return (
    <div className="section-separator-wrapper py-6 opacity-30" aria-hidden>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="h-px w-full max-w-3xl mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </div>
  );
}
