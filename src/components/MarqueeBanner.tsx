/** Scrolling marquee text banner - Spoils Trophy style */

export default function MarqueeBanner() {
  const text =
    "PREMIUM EVENT MANAGEMENT - WEDDINGS - CORPORATE - CELEBRATIONS - BIRTHDAYS - ENGAGEMENTS - HALDI - SANGEET - MEHENDI - TURNING MOMENTS INTO UNFORGETTABLE CELEBRATIONS - ";

  return (
    <div className="marquee-banner relative py-4 overflow-hidden border-y border-ivory/10 bg-charcoal">
      <div className="marquee-track flex whitespace-nowrap w-max">
        <span className="text-ivory/90 text-sm sm:text-base font-medium tracking-[0.3em] uppercase px-4">
          {text.repeat(3)}
        </span>
      </div>
    </div>
  );
}
