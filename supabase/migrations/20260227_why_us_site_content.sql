-- Update Why Choose Us section copy to the new description.
UPDATE site_content
SET
  title = 'Why Phoenix Events?',
  subtitle = 'Why Choose Us',
  description = 'We craft experiences that transcend moments and become cherished memories. With over a decade of expertise, we transform visions into beautifully executed realities — defined by creativity, precision, and uncompromising attention to detail.',
  updated_at = now()
WHERE section_key = 'why-us';
