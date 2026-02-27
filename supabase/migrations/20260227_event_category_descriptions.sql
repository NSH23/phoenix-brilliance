-- Update event category descriptions for homepage / event pages.
-- Uses short_description for the homepage snippet; description can hold full copy.
-- Safe to run multiple times (idempotent).

UPDATE events SET
  short_description = 'Celebrate the timeless art of Mehendi in a setting rich with color and culture. We craft elegant, thoughtfully styled spaces adorned with traditional accents, ambient lighting, and artistic décor — creating a vibrant yet graceful atmosphere for your special day.',
  description = 'Celebrate the timeless art of Mehendi in a setting rich with color and culture. We craft elegant, thoughtfully styled spaces adorned with traditional accents, ambient lighting, and artistic décor — creating a vibrant yet graceful atmosphere for your special day.',
  updated_at = now()
WHERE slug = 'mehendi';

UPDATE events SET
  short_description = 'Rekindle romance and celebrate your cherished milestones with an exquisitely curated anniversary celebration. From intimate candlelit evenings to grand, elegant gatherings, we craft experiences that honour your journey and create timeless memories.',
  description = 'Rekindle romance and celebrate your cherished milestones with an exquisitely curated anniversary celebration. From intimate candlelit evenings to grand, elegant gatherings, we craft experiences that honour your journey and create timeless memories.',
  updated_at = now()
WHERE slug = 'anniversary';

UPDATE events SET
  short_description = 'Elevate your brand with expertly curated corporate experiences. From impactful product launches and seamless conferences to refined gala dinners, we deliver precision, professionalism, and impeccable execution at every stage. Because every corporate event should reflect excellence.',
  description = 'Elevate your brand with expertly curated corporate experiences. From impactful product launches and seamless conferences to refined gala dinners, we deliver precision, professionalism, and impeccable execution at every stage. Because every corporate event should reflect excellence.',
  updated_at = now()
WHERE slug = 'corporate';

UPDATE events SET
  short_description = 'Celebrate another year with elegance and distinction. We curate refined, bespoke birthday experiences — from intimate gatherings to grand soirées — designed with impeccable detail and timeless style. Because every milestone deserves a celebration that feels extraordinary.',
  description = 'Celebrate another year with elegance and distinction. We curate refined, bespoke birthday experiences — from intimate gatherings to grand soirées — designed with impeccable detail and timeless style. Because every milestone deserves a celebration that feels extraordinary.',
  updated_at = now()
WHERE slug = 'birthday';

UPDATE events SET
  short_description = 'Mark the beginning of your forever with an elegant and enchanting engagement celebration. We design romantic, thoughtfully curated settings that beautifully reflect your love story — timeless, graceful, and unforgettable.',
  description = 'Mark the beginning of your forever with an elegant and enchanting engagement celebration. We design romantic, thoughtfully curated settings that beautifully reflect your love story — timeless, graceful, and unforgettable.',
  updated_at = now()
WHERE slug = 'engagement';

UPDATE events SET
  short_description = 'Celebrate the rhythm of love with an exquisitely curated Sangeet soirée. We harmonize traditional elegance with contemporary entertainment, crafting vibrant, high-energy celebrations that are both graceful and unforgettable.',
  description = 'Celebrate the rhythm of love with an exquisitely curated Sangeet soirée. We harmonize traditional elegance with contemporary entertainment, crafting vibrant, high-energy celebrations that are both graceful and unforgettable.',
  updated_at = now()
WHERE slug = 'sangeet';

UPDATE events SET
  short_description = 'Celebrate tradition with a thoughtfully curated Haldi ceremony. With vibrant décor, authentic elements, and a radiant, joyful ambiance, we create a setting that feels pure, auspicious, and beautifully memorable.',
  description = 'Celebrate tradition with a thoughtfully curated Haldi ceremony. With vibrant décor, authentic elements, and a radiant, joyful ambiance, we create a setting that feels pure, auspicious, and beautifully memorable.',
  updated_at = now()
WHERE slug = 'haldi';

UPDATE events SET
  short_description = 'Elegance is not just a style — it''s an experience. Transform your dream wedding into a vision of timeless elegance with our refined planning and flawless execution. From intimate gatherings to grand celebrations, we curate every detail with sophistication, grace, and perfection — creating moments that are beautifully unforgettable. Where luxury meets emotion, and every celebration feels effortlessly elegant.',
  description = 'Elegance is not just a style — it''s an experience. Transform your dream wedding into a vision of timeless elegance with our refined planning and flawless execution. From intimate gatherings to grand celebrations, we curate every detail with sophistication, grace, and perfection — creating moments that are beautifully unforgettable. Where luxury meets emotion, and every celebration feels effortlessly elegant.',
  updated_at = now()
WHERE slug = 'wedding';
