/**
 * Frame templates for homepage gallery rows.
 * Admin can select which frame style to use for images.
 */
export const GALLERY_FRAME_TEMPLATES = {
  polaroid: {
    id: 'polaroid',
    name: 'Polaroid',
    description: 'Classic polaroid photo frame with white border',
  },
  rounded: {
    id: 'rounded',
    name: 'Rounded',
    description: 'Soft rounded corners with subtle shadow',
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    description: 'Elegant drop shadow and border',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Antique-style frame with worn edges',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean thin border, no shadow',
  },
} as const;

export type GalleryFrameTemplateId = keyof typeof GALLERY_FRAME_TEMPLATES;
