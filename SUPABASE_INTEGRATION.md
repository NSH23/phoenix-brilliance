# Supabase Integration Guide

This document explains how Supabase has been integrated into your Phoenix Events application.

## ✅ What's Been Integrated

### 1. **AdminContext** (`src/contexts/AdminContext.tsx`)
- ✅ Updated to use Supabase Authentication
- ✅ Automatically checks for existing sessions
- ✅ Listens for auth state changes
- ✅ Validates admin users against `admin_users` table
- ✅ Handles login/logout with Supabase Auth

### 2. **Service Layer** (`src/services/`)
All database operations are now available through service functions:

- **`events.ts`** - Event management (CRUD operations)
- **`albums.ts`** - Album management with media
- **`gallery.ts`** - Gallery image management
- **`collaborations.ts`** - Partner/collaboration management
- **`services.ts`** - Service offerings management
- **`testimonials.ts`** - Testimonial management
- **`inquiries.ts`** - Contact form inquiry management
- **`siteContent.ts`** - Site content, settings, social links, contact info
- **`storage.ts`** - File upload/delete utilities for Supabase Storage

### 3. **ImageUpload Component** (`src/components/admin/ImageUpload.tsx`)
- ✅ Updated to support Supabase Storage uploads
- ✅ Supports both immediate upload and preview-then-upload modes
- ✅ Handles multiple file uploads
- ✅ Shows upload progress

## 🚀 How to Use

### Authentication

The login flow is already integrated. Users need to:
1. Sign up/login via Supabase Auth
2. Be added to `admin_users` table with appropriate role

### Using Service Functions

```typescript
import { getActiveEvents, createEvent, updateEvent } from '@/services/events';
import { uploadFile } from '@/services/storage';

// Get events
const events = await getActiveEvents();

// Create event
const newEvent = await createEvent({
  title: 'Wedding',
  slug: 'wedding',
  description: '...',
  short_description: '...',
  cover_image: '...',
  is_active: true,
  display_order: 1,
});

// Upload image
const imageUrl = await uploadFile('event-images', file);
```

### Using ImageUpload Component

```typescript
import ImageUpload from '@/components/admin/ImageUpload';

// With immediate upload
<ImageUpload
  value={coverImage}
  onChange={setCoverImage}
  bucket="event-images"
  uploadOnSelect={true}
/>

// With preview then manual upload
<ImageUpload
  value={images}
  onChange={setImages}
  multiple={true}
  bucket="gallery-images"
  uploadOnSelect={false}
/>
```

## 📝 Next Steps

### 1. Install Supabase Package

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Update Admin Pages

Replace mock data usage with service functions:

**Before:**
```typescript
const [events, setEvents] = useState<Event[]>(mockEvents);
```

**After:**
```typescript
import { getAllEvents } from '@/services/events';

useEffect(() => {
  const loadEvents = async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    }
  };
  loadEvents();
}, []);
```

### 4. Update Public Pages

Replace static data with Supabase queries:

**Example for EventsSection:**
```typescript
import { getActiveEvents } from '@/services/events';

useEffect(() => {
  const loadEvents = async () => {
    try {
      const data = await getActiveEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };
  loadEvents();
}, []);
```

### 5. Update Contact Form

Update `src/components/ContactSection.tsx` or `src/pages/Contact.tsx`:

```typescript
import { createInquiry } from '@/services/inquiries';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await createInquiry({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      event_type: formData.eventType,
      message: formData.message,
    });
    toast.success('Thank you! We will contact you soon.');
    // Reset form
  } catch (error) {
    toast.error('Failed to submit. Please try again.');
  }
};
```

## 🔧 Service Functions Reference

### Events
- `getActiveEvents()` - Get all active events (public)
- `getAllEvents()` - Get all events (admin)
- `getEventById(id)` - Get single event
- `getEventBySlug(slug)` - Get event by slug
- `getEventWithSteps(slug)` - Get event with steps
- `createEvent(event)` - Create new event
- `updateEvent(id, updates)` - Update event
- `deleteEvent(id)` - Delete event
- `getEventSteps(eventId)` - Get event steps
- `createEventStep(step)` - Create step
- `updateEventStep(id, updates)` - Update step
- `deleteEventStep(id)` - Delete step

### Albums
- `getAllAlbums()` - Get all albums
- `getAlbumsByEventId(eventId)` - Get albums for event
- `getFeaturedAlbums(limit)` - Get featured albums
- `getAlbumById(id)` - Get single album
- `getAlbumWithMedia(id)` - Get album with media
- `createAlbum(album)` - Create album
- `updateAlbum(id, updates)` - Update album
- `deleteAlbum(id)` - Delete album
- `getAlbumMedia(albumId)` - Get album media
- `createAlbumMedia(media)` - Add media to album
- `updateAlbumMedia(id, updates)` - Update media
- `deleteAlbumMedia(id)` - Delete media

### Gallery
- `getAllGalleryImages()` - Get all images
- `getGalleryImagesByCategory(category)` - Get by category
- `getFeaturedGalleryImages(limit)` - Get featured
- `getGalleryCategories()` - Get all categories
- `createGalleryImage(image)` - Add image
- `updateGalleryImage(id, updates)` - Update image
- `deleteGalleryImage(id)` - Delete image
- `deleteGalleryImages(ids)` - Bulk delete

### Storage
- `uploadFile(bucket, file, path?)` - Upload single file
- `uploadFiles(bucket, files, pathPrefix?)` - Upload multiple
- `deleteFile(bucket, path)` - Delete file
- `deleteFiles(bucket, paths)` - Delete multiple
- `getPublicUrl(bucket, path)` - Get public URL

### Inquiries
- `createInquiry(inquiry)` - Submit inquiry (public)
- `getAllInquiries()` - Get all (admin)
- `getInquiriesByStatus(status)` - Filter by status
- `updateInquiry(id, updates)` - Update inquiry
- `deleteInquiry(id)` - Delete inquiry
- `getInquiryStats()` - Get statistics

## 🎯 Example: Updating Admin Events Page

```typescript
import { useState, useEffect } from 'react';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '@/services/events';
import { toast } from 'sonner';

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (eventData: Partial<Event>) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(eventData as Event);
        toast.success('Event created successfully');
      }
      loadEvents(); // Reload list
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast.success('Event deleted successfully');
      loadEvents(); // Reload list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // ... rest of component
}
```

## 🔐 Security Notes

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Public Access**: Only active/public content is accessible without auth
3. **Admin Access**: Admin operations require authentication via `admin_users` table
4. **Storage**: Bucket policies control file access

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Check your `.env` file exists and has correct values
- Restart your dev server after adding `.env` file

### "User is not an admin"
- User must exist in `admin_users` table
- Check user ID matches between `auth.users` and `admin_users`

### "RLS policy violation"
- Verify user is authenticated
- Check RLS policies in Supabase Dashboard
- Ensure user is in `admin_users` table

### "Storage upload failed"
- Check bucket exists and is configured correctly
- Verify storage policies are set up
- Check file size limits

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
