-- ============================================
-- Insert partner venues into collaborations table
-- Run this in Supabase SQL Editor
-- ============================================

INSERT INTO collaborations (name, logo_url, description, location, map_url, is_active, display_order)
VALUES
  (
    'Sky Blue Banquet Hall',
    NULL,
    'Sky Blue Banquet Hall is a highly-rated event venue (4.7★) located on Aundh-Ravet BRTS Road near Hanging Bridge. Known for hosting weddings, birthdays, and social functions, offering elegant decor, spacious halls, and supportive event services.',
    'Sr. No 1/8, Ravet, Aundh-Ravet BRTS Rd, near Hanging Bridge, Punawale, Pimpri-Chinchwad, Maharashtra 411033',
    'https://maps.app.goo.gl/rJyjQ9qXM1ZsZbqd9',
    true,
    0
  ),
  (
    'Blue Water Banquet Hall',
    NULL,
    'Blue Water Banquet Hall is a well-reviewed banquet venue (5.0★) on Aundh-Ravet BRTS Road suitable for weddings, receptions, birthdays, and other celebrations. Appreciated for its event-friendly space and supportive staff.',
    'Aundh-Ravet BRTS Rd, off Ravet, Vishnu Dev Nagar, Punawale, Pimpri-Chinchwad, Maharashtra 411033',
    'https://maps.app.goo.gl/9V1tJ56uJpM6KkJQ7',
    true,
    1
  ),
  (
    'RamKrishna Veg Resto & Banquet',
    NULL,
    'RamKrishna Veg Resto & Banquet (4.4★) is a vegetarian restaurant and event space in Ravet, Pimpri-Chinchwad. It combines quality pure veg dining with banquet facilities, suitable for family events, small weddings, and celebrations with catering included.',
    'Malakar, Ravet BRT Road, Maske Vasti Rd, next to Shell Pump, Ravet, Pimpri-Chinchwad, Pune, Maharashtra 412101',
    'https://maps.app.goo.gl/7jJwRaQjyQ6ZJj8B7',
    true,
    2
  ),
  (
    'Shree Krishna Palace | Pure Veg',
    NULL,
    'Shree Krishna Palace (4.3★) is a popular pure vegetarian restaurant near Kharalwadi in Pimpri Colony. While primarily a dining venue, it also serves as a casual event space for family get-togethers and celebratory meals.',
    'Next to Hindustan Antibiotics, Kharalwadi, Pimpri Colony, Pimpri-Chinchwad, Pune, Maharashtra 411018',
    'https://maps.app.goo.gl/EHnGEkyv1sP1BhsD7',
    true,
    3
  ),
  (
    'RAGHUNANDAN AC BANQUET & LAWNS',
    NULL,
    'Raghunandan AC Banquet & Lawns (4.0★) is a versatile banquet and outdoor event venue with good reviews for weddings, receptions, and social functions. It offers air-conditioned halls and lawn space, suitable for medium-to-large gatherings.',
    'Sr No 26, Aundh-Ravet BRTS Rd, Nimbalkar Nagar, Tathawade, Pimpri-Chinchwad, Pune, Maharashtra 411033',
    'https://maps.app.goo.gl/v6tLDEBtadci1qWFA',
    true,
    4
  ),
  (
    'Rangoli Banquet Hall',
    NULL,
    'Rangoli Banquet Hall (4.3★) is a well-liked event venue on Chinchwad Station Road in Vijay Nagar. It serves as a banquet and wedding venue for celebrations, receptions, and social events.',
    'Shewale Complex, Chinchwad Station Rd, opposite Elpro Complex, Vijay Nagar, Pimpri-Chinchwad, Maharashtra 411033',
    'https://maps.app.goo.gl/uRc8J9yLd8TQzKwi8',
    true,
    5
  );
