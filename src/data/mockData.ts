// Mock data for the admin dashboard and public pages
// Replace this with your actual backend API calls

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  isActive: boolean;
  displayOrder: number;
  steps: EventStep[];
}

export interface EventStep {
  id: string;
  eventId: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
}

export interface Album {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  description: string;
  coverImage: string;
  eventDate: string;
  isFeatured: boolean;
  mediaCount: number;
}

export interface AlbumMedia {
  id: string;
  albumId: string;
  type: 'image' | 'video';
  url: string;
  youtubeUrl?: string;
  caption: string;
  isFeatured: boolean;
  displayOrder: number;
}

export interface Collaboration {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  location: string;
  mapUrl?: string;
  isActive: boolean;
  displayOrder: number;
  images: CollaborationImage[];
  steps: CollaborationStep[];
}

export interface CollaborationImage {
  id: string;
  collaborationId: string;
  imageUrl: string;
  caption: string;
}

export interface CollaborationStep {
  id: string;
  collaborationId: string;
  stepNumber: number;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
  eventType: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  message: string;
  date: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
}

export interface SiteContent {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
}

// Mock Events Data
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Wedding',
    slug: 'wedding',
    description: 'Create the wedding of your dreams with our expert planning and execution. From intimate ceremonies to grand celebrations, we handle every detail with precision and elegance.',
    shortDescription: 'Transform your dream wedding into reality',
    coverImage: '/wedding 1.jpg',
    isActive: true,
    displayOrder: 1,
    steps: [
      { id: '1-1', eventId: '1', stepNumber: 1, title: 'Initial Consultation', description: 'Meet with our team to discuss your vision, preferences, and budget.', icon: 'MessageCircle' },
      { id: '1-2', eventId: '1', stepNumber: 2, title: 'Venue Selection', description: 'We help you find the perfect venue that matches your dream wedding.', icon: 'MapPin' },
      { id: '1-3', eventId: '1', stepNumber: 3, title: 'Design & Planning', description: 'Create detailed designs, themes, and timelines for your special day.', icon: 'Palette' },
      { id: '1-4', eventId: '1', stepNumber: 4, title: 'Vendor Coordination', description: 'Coordinate with caterers, decorators, photographers, and entertainers.', icon: 'Users' },
      { id: '1-5', eventId: '1', stepNumber: 5, title: 'Setup & Execution', description: 'Our team handles complete setup and ensures flawless execution.', icon: 'CheckCircle' },
      { id: '1-6', eventId: '1', stepNumber: 6, title: 'Day-of Coordination', description: 'Full event management so you can enjoy your special day stress-free.', icon: 'Star' },
    ],
  },
  {
    id: '2',
    title: 'Birthday',
    slug: 'birthday',
    description: 'Make every birthday unforgettable with themed decorations, entertainment, and personalized experiences for all ages.',
    shortDescription: 'Celebrate life\'s milestones with joy',
    coverImage: '/birthday.jpg',
    isActive: true,
    displayOrder: 2,
    steps: [
      { id: '2-1', eventId: '2', stepNumber: 1, title: 'Theme Selection', description: 'Choose from our curated themes or create a custom one.', icon: 'Sparkles' },
      { id: '2-2', eventId: '2', stepNumber: 2, title: 'Planning Session', description: 'Finalize guest list, activities, and special requirements.', icon: 'ClipboardList' },
      { id: '2-3', eventId: '2', stepNumber: 3, title: 'Decoration Setup', description: 'Transform your venue into a party paradise.', icon: 'PartyPopper' },
      { id: '2-4', eventId: '2', stepNumber: 4, title: 'Party Execution', description: 'Manage games, activities, and entertainment throughout.', icon: 'Cake' },
    ],
  },
  {
    id: '3',
    title: 'Corporate Events',
    slug: 'corporate',
    description: 'Professional event management for conferences, seminars, product launches, and team building activities.',
    shortDescription: 'Elevate your corporate gatherings',
    coverImage: '/coprate.jpg',
    isActive: true,
    displayOrder: 3,
    steps: [
      { id: '3-1', eventId: '3', stepNumber: 1, title: 'Requirement Analysis', description: 'Understand your objectives, audience, and expectations.', icon: 'Target' },
      { id: '3-2', eventId: '3', stepNumber: 2, title: 'Proposal & Budget', description: 'Receive detailed proposal with cost breakdown.', icon: 'FileText' },
      { id: '3-3', eventId: '3', stepNumber: 3, title: 'Logistics Planning', description: 'Handle venue, AV equipment, catering, and more.', icon: 'Settings' },
      { id: '3-4', eventId: '3', stepNumber: 4, title: 'Event Execution', description: 'Professional management from start to finish.', icon: 'Award' },
    ],
  },
  {
    id: '4',
    title: 'Engagement',
    slug: 'engagement',
    description: 'Celebrate the beginning of forever with a beautifully organized engagement ceremony.',
    shortDescription: 'Mark the start of your forever',
    coverImage: '/engagement.jpg',
    isActive: true,
    displayOrder: 4,
    steps: [],
  },
  {
    id: '5',
    title: 'Haldi Ceremony',
    slug: 'haldi',
    description: 'Traditional haldi ceremonies with vibrant decorations and cultural authenticity.',
    shortDescription: 'Embrace the golden traditions',
    coverImage: '/haldi.jpg',
    isActive: true,
    displayOrder: 5,
    steps: [],
  },
  {
    id: '6',
    title: 'Mehendi',
    slug: 'mehendi',
    description: 'Colorful mehendi celebrations with stunning setups and entertainment.',
    shortDescription: 'Colors of love and joy',
    coverImage: '/mehendi.jpg',
    isActive: true,
    displayOrder: 6,
    steps: [],
  },
  {
    id: '7',
    title: 'Sangeet',
    slug: 'sangeet',
    description: 'Dance the night away with spectacular sangeet celebrations.',
    shortDescription: 'Dance, music, and memories',
    coverImage: '/sangeet.jpg',
    isActive: true,
    displayOrder: 7,
    steps: [],
  },
  {
    id: '8',
    title: 'Anniversary',
    slug: 'anniversary',
    description: 'Celebrate years of togetherness with romantic anniversary events.',
    shortDescription: 'Celebrate your love story',
    coverImage: '/anniversary.jpg',
    isActive: true,
    displayOrder: 8,
    steps: [],
  },
  {
    id: '9',
    title: 'Car Opening',
    slug: 'car-opening',
    description: 'Grand car unveiling ceremonies with showroom-quality presentations.',
    shortDescription: 'Unveil in style',
    coverImage: '/gallery wedding.jpg',
    isActive: true,
    displayOrder: 9,
    steps: [],
  },
];

// Mock Albums Data
export const mockAlbums: Album[] = [
  {
    id: '1',
    eventId: '1',
    eventTitle: 'Wedding',
    title: 'Sharma-Patel Wedding 2024',
    description: 'A beautiful destination wedding in Udaipur with traditional ceremonies and modern celebrations.',
    coverImage: '/wedding 1.jpg',
    eventDate: '2024-02-15',
    isFeatured: true,
    mediaCount: 245,
  },
  {
    id: '2',
    eventId: '1',
    eventTitle: 'Wedding',
    title: 'Kumar Royal Wedding',
    description: 'Grand wedding celebration spanning three days with multiple ceremonies.',
    coverImage: '/gallery wedding.jpg',
    eventDate: '2024-01-20',
    isFeatured: false,
    mediaCount: 180,
  },
  {
    id: '3',
    eventId: '2',
    eventTitle: 'Birthday',
    title: 'Little Princess 5th Birthday',
    description: 'Magical princess themed birthday party with castle decorations.',
    coverImage: '/birthday.jpg',
    eventDate: '2024-03-10',
    isFeatured: true,
    mediaCount: 95,
  },
  {
    id: '4',
    eventId: '3',
    eventTitle: 'Corporate Events',
    title: 'TechCorp Annual Meet 2024',
    description: 'Professional corporate event with product launch and networking.',
    coverImage: '/coprate.jpg',
    eventDate: '2024-03-25',
    isFeatured: false,
    mediaCount: 120,
  },
  {
    id: '5',
    eventId: '5',
    eventTitle: 'Haldi Ceremony',
    title: 'Vibrant Haldi Celebration',
    description: 'Traditional haldi ceremony with yellow decor and joyful moments.',
    coverImage: '/haldi.jpg',
    eventDate: '2024-02-13',
    isFeatured: true,
    mediaCount: 75,
  },
  {
    id: '6',
    eventId: '6',
    eventTitle: 'Mehendi',
    title: 'Colorful Mehendi Night',
    description: 'Beautiful mehendi celebration with live music and dance.',
    coverImage: '/mehendi.jpg',
    eventDate: '2024-02-14',
    isFeatured: false,
    mediaCount: 88,
  },
];

// Mock Album Media
export const mockAlbumMedia: AlbumMedia[] = [
  { id: '1', albumId: '1', type: 'image', url: '/wedding 1.jpg', caption: 'The grand entrance', isFeatured: true, displayOrder: 1 },
  { id: '2', albumId: '1', type: 'image', url: '/gallery wedding.jpg', caption: 'Wedding ceremony', isFeatured: false, displayOrder: 2 },
  { id: '3', albumId: '1', type: 'video', url: '', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Highlights Reel', isFeatured: false, displayOrder: 3 },
  { id: '4', albumId: '1', type: 'image', url: '/engagement.jpg', caption: 'Ring ceremony', isFeatured: false, displayOrder: 4 },
  { id: '5', albumId: '1', type: 'image', url: '/sangeet.jpg', caption: 'Sangeet performance', isFeatured: false, displayOrder: 5 },
];

// Mock Collaborations
export const mockCollaborations: Collaboration[] = [
  {
    id: '1',
    name: 'Grand Palace Hotel',
    logoUrl: '/logo.jpg',
    description: 'Luxury 5-star hotel with stunning ballrooms and outdoor venues. Perfect for grand weddings and corporate events.',
    location: 'Mumbai, Maharashtra',
    mapUrl: 'https://maps.google.com',
    isActive: true,
    displayOrder: 1,
    images: [
      { id: '1-1', collaborationId: '1', imageUrl: '/wedding 1.jpg', caption: 'Grand Ballroom' },
      { id: '1-2', collaborationId: '1', imageUrl: '/gallery wedding.jpg', caption: 'Outdoor Garden' },
    ],
    steps: [
      { id: '1-s1', collaborationId: '1', stepNumber: 1, title: 'Contact Phoenix Events', description: 'Reach out to us with your event requirements.' },
      { id: '1-s2', collaborationId: '1', stepNumber: 2, title: 'Venue Visit', description: 'We arrange a site visit with special partner rates.' },
      { id: '1-s3', collaborationId: '1', stepNumber: 3, title: 'Booking', description: 'Get exclusive discounts when booking through us.' },
    ],
  },
  {
    id: '2',
    name: 'Royal Gardens Resort',
    logoUrl: '/logo.jpg',
    description: 'Beautiful resort with lush gardens and traditional architecture. Ideal for destination weddings.',
    location: 'Pune, Maharashtra',
    isActive: true,
    displayOrder: 2,
    images: [],
    steps: [],
  },
  {
    id: '3',
    name: 'Skyline Convention Center',
    logoUrl: '/logo.jpg',
    description: 'Modern convention center with state-of-the-art facilities for corporate events.',
    location: 'Bangalore, Karnataka',
    isActive: true,
    displayOrder: 3,
    images: [],
    steps: [],
  },
];

// Mock Testimonials
export const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rahul & Priya Sharma',
    role: 'Wedding Couple',
    content: 'Phoenix Events made our wedding absolutely magical! Every detail was perfect.',
    avatar: '/logo.jpg',
    rating: 5,
    eventType: 'Wedding',
  },
  {
    id: '2',
    name: 'Amit Kumar',
    role: 'CEO, TechCorp',
    content: 'Professional, punctual, and exceeded our expectations for our annual event.',
    avatar: '/logo.jpg',
    rating: 5,
    eventType: 'Corporate',
  },
  {
    id: '3',
    name: 'Sneha Patel',
    role: 'Mother',
    content: 'My daughter\'s birthday party was the talk of the town! Amazing decorations!',
    avatar: '/logo.jpg',
    rating: 5,
    eventType: 'Birthday',
  },
];

// Mock Inquiries
export const mockInquiries: Inquiry[] = [
  {
    id: '1',
    name: 'Vikram Malhotra',
    email: 'vikram@email.com',
    phone: '+91 98765 43210',
    eventType: 'Wedding',
    message: 'Looking for complete wedding planning services for February 2025.',
    date: '2024-01-15T10:30:00',
    status: 'new',
  },
  {
    id: '2',
    name: 'Neha Gupta',
    email: 'neha@email.com',
    phone: '+91 87654 32109',
    eventType: 'Birthday',
    message: 'Want to organize a 50th birthday surprise party for my father.',
    date: '2024-01-14T14:45:00',
    status: 'contacted',
  },
  {
    id: '3',
    name: 'Corporate Solutions Ltd',
    email: 'events@corpsol.com',
    phone: '+91 76543 21098',
    eventType: 'Corporate',
    message: 'Annual conference for 500+ attendees in March.',
    date: '2024-01-13T09:15:00',
    status: 'converted',
  },
];

// Mock Site Content
export const mockSiteContent: SiteContent[] = [
  {
    id: '1',
    sectionKey: 'hero',
    title: 'Creating Magical Moments',
    subtitle: 'Phoenix Events & Production',
    description: 'Transform your special occasions into unforgettable memories with our expert event planning and production services.',
    ctaText: 'Get Started',
    ctaLink: '/contact',
  },
  {
    id: '2',
    sectionKey: 'events',
    title: 'Our Events',
    subtitle: 'What We Celebrate',
    description: 'From intimate gatherings to grand celebrations, we bring your vision to life.',
  },
  {
    id: '3',
    sectionKey: 'gallery',
    title: 'Our Gallery',
    subtitle: 'Captured Moments',
    description: 'Browse through our collection of beautiful events we\'ve had the pleasure of creating.',
  },
];
