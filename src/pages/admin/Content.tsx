import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, FileText, Link as LinkIcon, Trophy, Heart, Users, Shield, Loader2, Calendar, ImageIcon, Handshake } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getPageHeroContent,
  upsertPageHeroContent,
  type PageHeroContent,
  type PageHeroStat,
} from '@/services/pageHeroContent';
import {
  getAllSiteContent,
  updateSiteContent,
  upsertSiteContent,
  getAllSocialLinks,
  upsertSocialLink,
  getContactInfoOptional,
  upsertContactInfo,
  type SiteContent,
} from '@/services/siteContent';
import { toast } from 'sonner';



interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  whatsapp: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

const DEFAULT_STATS: PageHeroStat[] = [
  { value: '', label: '' },
  { value: '', label: '' },
  { value: '', label: '' },
];

const DEFAULT_EVENTS: PageHeroContent = {
  id: '',
  page_key: 'events',
  title: 'Our Events',
  subtitle: 'Events We Celebrate',
  description: 'From intimate gatherings to grand celebrations, we bring your vision to life with meticulous planning and flawless execution.',
  stats: [
    { value: '8+', label: 'Event Types' },
    { value: '1+', label: 'Events Completed' },
    { value: '50+', label: 'Happy Clients' },
  ],
  created_at: '',
  updated_at: '',
};

const DEFAULT_GALLERY: PageHeroContent = {
  id: '',
  page_key: 'gallery',
  title: 'Our Portfolio',
  subtitle: "Moments We've Captured",
  description: "Browse through our collection of stunning events, each album telling a unique story of celebration and joy.",
  stats: [
    { value: '0+', label: 'Photos' },
    { value: '1', label: 'Albums' },
    { value: '1', label: 'Event Types' },
  ],
  created_at: '',
  updated_at: '',
};

const DEFAULT_COLLABORATIONS: PageHeroContent = {
  id: '',
  page_key: 'collaborations',
  title: 'Our Network',
  subtitle: 'Trusted Collaborations',
  description: 'We partner with the finest venues and vendors to deliver exceptional experiences for your special occasions.',
  stats: [
    { value: '25+', label: 'Partner Venues' },
    { value: '100+', label: 'Events Together' },
    { value: '50K+', label: 'Happy Guests' },
  ],
  created_at: '',
  updated_at: '',
};

function ensureThree(stats: PageHeroStat[]): PageHeroStat[] {
  const a = [...(stats || [])];
  while (a.length < 3) a.push({ value: '', label: '' });
  return a.slice(0, 3);
}

export default function AdminContent() {

  const [eventsPage, setEventsPage] = useState<PageHeroContent | null>(null);
  const [galleryPage, setGalleryPage] = useState<PageHeroContent | null>(null);
  const [collaborationsPage, setCollaborationsPage] = useState<PageHeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [content, setContent] = useState<SiteContent[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: '',
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      // Ensure default sections exist
      const requiredSections = [
        {
          section_key: 'home-hero',
          title: 'Crafting Moments That Last Forever',
          subtitle: 'Phoenix Events & Production',
          description: 'From weddings to corporate celebrations, we turn your vision into unforgettable experiences with elegance and precision.',
          cta_text: 'Plan Your Event',
          cta_link: '/contact'
        },
        {
          section_key: 'about',
          title: 'The Art of Crafting Unforgettable Celebrations',
          subtitle: 'About Us',
          description: 'We believe that celebrations are not simply events — they are chapters in a story that deserves to be told beautifully. Phoenix Events & Production was born from a passion for transforming ordinary spaces into extraordinary experiences.',
          cta_text: 'Read More',
          cta_link: '/about'
        },
        {
          section_key: 'why-us',
          title: 'Why Phoenix Events?',
          subtitle: 'Why Choose Us',
          description: 'We create experiences that become cherished memories. With over a decade of expertise, we bring your dreams to life.'
        }
      ];

      for (const section of requiredSections) {
        await upsertSiteContent(section).catch(err => console.error(`Failed to seed ${section.section_key}`, err));
      }

      const [e, g, collab, c, social, contact] = await Promise.all([
        getPageHeroContent('events').catch(() => null),
        getPageHeroContent('gallery').catch(() => null),
        getPageHeroContent('collaborations').catch(() => null),
        getAllSiteContent().catch(() => []),
        getAllSocialLinks().catch(() => []),
        getContactInfoOptional().catch(() => null),
      ]);
      setEventsPage(e ? { ...e, stats: ensureThree(e.stats) } : { ...DEFAULT_EVENTS });
      setGalleryPage(g ? { ...g, stats: ensureThree(g.stats) } : { ...DEFAULT_GALLERY });
      setCollaborationsPage(collab ? { ...collab, stats: ensureThree(collab.stats) } : { ...DEFAULT_COLLABORATIONS });
      setContent(c);
      const socialMap: Record<string, string> = {};
      social.forEach((l) => {
        socialMap[l.platform] = l.url;
      });
      setSocialLinks({
        facebook: socialMap.facebook || '',
        instagram: socialMap.instagram || '',
        youtube: socialMap.youtube || '',
        whatsapp: socialMap.whatsapp || '',
      });
      setContactInfo(
        contact
          ? { email: contact.email, phone: contact.phone, address: contact.address || '' }
          : { email: '', phone: '', address: '' }
      );
    } catch (err) {
      toast.error('Failed to load', { description: (err as Error)?.message });
    } finally {
      setLoading(false);
    }
  };



  const handleSaveEventsPage = async (data: { title?: string; subtitle?: string; description?: string; stats?: PageHeroStat[] }) => {
    setSaving('events');
    try {
      const updated = await upsertPageHeroContent('events', {
        title: data.title ?? eventsPage?.title ?? '',
        subtitle: data.subtitle ?? eventsPage?.subtitle ?? '',
        description: data.description ?? eventsPage?.description ?? '',
        stats: ensureThree(data.stats ?? eventsPage?.stats ?? []),
      });
      setEventsPage(updated);
      toast.success('Events page saved');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveGalleryPage = async (data: { title?: string; subtitle?: string; description?: string; stats?: PageHeroStat[] }) => {
    setSaving('gallery');
    try {
      const updated = await upsertPageHeroContent('gallery', {
        title: data.title ?? galleryPage?.title ?? '',
        subtitle: data.subtitle ?? galleryPage?.subtitle ?? '',
        description: data.description ?? galleryPage?.description ?? '',
        stats: ensureThree(data.stats ?? galleryPage?.stats ?? []),
      });
      setGalleryPage(updated);
      toast.success('Gallery page saved');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveCollaborationsPage = async (data: { title?: string; subtitle?: string; description?: string; stats?: PageHeroStat[] }) => {
    setSaving('collaborations');
    try {
      const updated = await upsertPageHeroContent('collaborations', {
        title: data.title ?? collaborationsPage?.title ?? '',
        subtitle: data.subtitle ?? collaborationsPage?.subtitle ?? '',
        description: data.description ?? collaborationsPage?.description ?? '',
        stats: ensureThree(data.stats ?? collaborationsPage?.stats ?? []),
      });
      setCollaborationsPage(updated);
      toast.success('Collaborations page saved');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleContentChange = (sectionKey: string, field: keyof SiteContent, value: string) => {
    setContent((c) => c.map((x) => (x.section_key === sectionKey ? { ...x, [field]: value } : x)));
  };

  const handleSaveContent = async () => {
    setSaving('sections');
    try {
      for (const section of content) {
        await updateSiteContent(section.section_key, {
          title: section.title,
          subtitle: section.subtitle,
          description: section.description,
          cta_text: section.cta_text,
          cta_link: section.cta_link,
        });
      }
      toast.success('Site content saved successfully');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSocial = async () => {
    setSaving('social');
    try {
      await Promise.all([
        upsertSocialLink('facebook', socialLinks.facebook),
        upsertSocialLink('instagram', socialLinks.instagram),
        upsertSocialLink('youtube', socialLinks.youtube),
        upsertSocialLink('whatsapp', socialLinks.whatsapp),
      ]);
      toast.success('Social links saved successfully');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveContact = async () => {
    setSaving('contact');
    try {
      await upsertContactInfo({
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: contactInfo.address || null,
      });
      toast.success('Contact information saved successfully');
    } catch (err) {
      toast.error('Failed to save', { description: (err as Error)?.message });
    } finally {
      setSaving(null);
    }
  };

  const handleResetContent = () => {
    load();
    toast.info('Content reloaded from database');
  };

  if (loading) {
    return (
      <AdminLayout title="Site Content" subtitle="Manage your website text and information">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Content" subtitle="Manage your website text and information">
      <Tabs defaultValue="events-page" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">

          <TabsTrigger value="events-page" className="gap-2">
            <Calendar className="w-4 h-4" />
            Events Page
          </TabsTrigger>
          <TabsTrigger value="gallery-page" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Gallery Page
          </TabsTrigger>
          <TabsTrigger value="collaborations-page" className="gap-2">
            <Handshake className="w-4 h-4" />
            Collaborations Page
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <FileText className="w-4 h-4" />
            Page Sections
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
        </TabsList>



        {/* Events Page hero */}
        <TabsContent value="events-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Events Page Hero</CardTitle>
              <CardDescription>Title, subtitle, description and 3 stats for /events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Title (badge)</Label>
                <Input
                  value={eventsPage?.title ?? ''}
                  onChange={(e) => setEventsPage((p) => (p ? { ...p, title: e.target.value } : { ...DEFAULT_EVENTS, title: e.target.value }))}
                  placeholder="Our Events"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subtitle (H1)</Label>
                <Input
                  value={eventsPage?.subtitle ?? ''}
                  onChange={(e) => setEventsPage((p) => (p ? { ...p, subtitle: e.target.value } : { ...DEFAULT_EVENTS, subtitle: e.target.value }))}
                  placeholder="Events We Celebrate"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={eventsPage?.description ?? ''}
                  onChange={(e) => setEventsPage((p) => (p ? { ...p, description: e.target.value } : { ...DEFAULT_EVENTS, description: e.target.value }))}
                  placeholder="From intimate gatherings to grand celebrations..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Stats (3)</Label>
                {ensureThree(eventsPage?.stats ?? []).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={s.value}
                      onChange={(e) => {
                        const st = ensureThree(eventsPage?.stats ?? []);
                        st[i] = { ...st[i], value: e.target.value };
                        setEventsPage((p) => (p ? { ...p, stats: st } : null));
                      }}
                      placeholder="8+"
                      className="w-24"
                    />
                    <Input
                      value={s.label}
                      onChange={(e) => {
                        const st = ensureThree(eventsPage?.stats ?? []);
                        st[i] = { ...st[i], label: e.target.value };
                        setEventsPage((p) => (p ? { ...p, stats: st } : null));
                      }}
                      placeholder="Event Types"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSaveEventsPage(eventsPage ?? undefined)} disabled={saving === 'events'}>
                {saving === 'events' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Page hero */}
        <TabsContent value="gallery-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Page Hero</CardTitle>
              <CardDescription>Title, subtitle, description and 3 stats for /gallery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Title (badge)</Label>
                <Input
                  value={galleryPage?.title ?? ''}
                  onChange={(e) => setGalleryPage((p) => (p ? { ...p, title: e.target.value } : { ...DEFAULT_GALLERY, title: e.target.value }))}
                  placeholder="Our Portfolio"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subtitle (H1)</Label>
                <Input
                  value={galleryPage?.subtitle ?? ''}
                  onChange={(e) => setGalleryPage((p) => (p ? { ...p, subtitle: e.target.value } : { ...DEFAULT_GALLERY, subtitle: e.target.value }))}
                  placeholder="Moments We've Captured"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={galleryPage?.description ?? ''}
                  onChange={(e) => setGalleryPage((p) => (p ? { ...p, description: e.target.value } : { ...DEFAULT_GALLERY, description: e.target.value }))}
                  placeholder="Browse through our collection of stunning events..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Stats (3)</Label>
                {ensureThree(galleryPage?.stats ?? []).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={s.value}
                      onChange={(e) => {
                        const st = ensureThree(galleryPage?.stats ?? []);
                        st[i] = { ...st[i], value: e.target.value };
                        setGalleryPage((p) => (p ? { ...p, stats: st } : { ...DEFAULT_GALLERY, stats: st }));
                      }}
                      placeholder="0+"
                      className="w-24"
                    />
                    <Input
                      value={s.label}
                      onChange={(e) => {
                        const st = ensureThree(galleryPage?.stats ?? []);
                        st[i] = { ...st[i], label: e.target.value };
                        setGalleryPage((p) => (p ? { ...p, stats: st } : { ...DEFAULT_GALLERY, stats: st }));
                      }}
                      placeholder="Photos"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSaveGalleryPage(galleryPage ?? undefined)} disabled={saving === 'gallery'}>
                {saving === 'gallery' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaborations Page hero */}
        <TabsContent value="collaborations-page" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Collaborations Page Hero</CardTitle>
              <CardDescription>Title, subtitle, description and 3 stats for /collaborations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Title (badge)</Label>
                <Input
                  value={collaborationsPage?.title ?? ''}
                  onChange={(e) => setCollaborationsPage((p) => (p ? { ...p, title: e.target.value } : { ...DEFAULT_COLLABORATIONS, title: e.target.value }))}
                  placeholder="Our Network"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subtitle (H1)</Label>
                <Input
                  value={collaborationsPage?.subtitle ?? ''}
                  onChange={(e) => setCollaborationsPage((p) => (p ? { ...p, subtitle: e.target.value } : { ...DEFAULT_COLLABORATIONS, subtitle: e.target.value }))}
                  placeholder="Trusted Collaborations"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={collaborationsPage?.description ?? ''}
                  onChange={(e) => setCollaborationsPage((p) => (p ? { ...p, description: e.target.value } : { ...DEFAULT_COLLABORATIONS, description: e.target.value }))}
                  placeholder="We partner with the finest venues and vendors..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Stats (3)</Label>
                {ensureThree(collaborationsPage?.stats ?? []).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={s.value}
                      onChange={(e) => {
                        const st = ensureThree(collaborationsPage?.stats ?? []);
                        st[i] = { ...st[i], value: e.target.value };
                        setCollaborationsPage((p) => (p ? { ...p, stats: st } : { ...DEFAULT_COLLABORATIONS, stats: st }));
                      }}
                      placeholder="25+"
                      className="w-24"
                    />
                    <Input
                      value={s.label}
                      onChange={(e) => {
                        const st = ensureThree(collaborationsPage?.stats ?? []);
                        st[i] = { ...st[i], label: e.target.value };
                        setCollaborationsPage((p) => (p ? { ...p, stats: st } : { ...DEFAULT_COLLABORATIONS, stats: st }));
                      }}
                      placeholder="Partner Venues"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSaveCollaborationsPage(collaborationsPage ?? undefined)} disabled={saving === 'collaborations'}>
                {saving === 'collaborations' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Edit the text content for different sections of your website.</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetContent}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSaveContent} disabled={saving === 'sections'}>
                {saving === 'sections' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {content.map((section, index) => (
              <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{section.section_key.replace(/-/g, ' ')} Section</CardTitle>
                    <CardDescription>Edit the content for the {section.section_key} section of your website.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`${section.section_key}-title`}>Title</Label>
                      <Input
                        id={`${section.section_key}-title`}
                        value={section.title || ''}
                        onChange={(e) => handleContentChange(section.section_key, 'title', e.target.value)}
                        placeholder="Section title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`${section.section_key}-subtitle`}>Subtitle</Label>
                      <Input
                        id={`${section.section_key}-subtitle`}
                        value={section.subtitle || ''}
                        onChange={(e) => handleContentChange(section.section_key, 'subtitle', e.target.value)}
                        placeholder="Section subtitle"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`${section.section_key}-description`}>Description</Label>
                      <Textarea
                        id={`${section.section_key}-description`}
                        value={section.description || ''}
                        onChange={(e) => handleContentChange(section.section_key, 'description', e.target.value)}
                        placeholder="Section description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor={`${section.section_key}-cta-text`}>CTA Text</Label>
                        <Input
                          id={`${section.section_key}-cta-text`}
                          value={section.cta_text || ''}
                          onChange={(e) => handleContentChange(section.section_key, 'cta_text', e.target.value)}
                          placeholder="Button text"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`${section.section_key}-cta-link`}>CTA Link</Label>
                        <Input
                          id={`${section.section_key}-cta-link`}
                          value={section.cta_link || ''}
                          onChange={(e) => handleContentChange(section.section_key, 'cta_link', e.target.value)}
                          placeholder="/contact"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {content.length === 0 && (
              <p className="text-muted-foreground">No sections found. Run the supabase-schema.sql seed to create default sections.</p>
            )}
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage your social media links displayed on the website.</p>
            <Button onClick={handleSaveSocial} disabled={saving === 'social'}>
              {saving === 'social' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Links
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input id="facebook" value={socialLinks.facebook} onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })} placeholder="https://facebook.com/yourpage" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input id="instagram" value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/yourpage" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input id="youtube" value={socialLinks.youtube} onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })} placeholder="https://youtube.com/@yourchannel" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" value={socialLinks.whatsapp} onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })} placeholder="+919876543210" />
                <p className="text-xs text-muted-foreground">Include country code without + symbol for WhatsApp link</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Update your business contact information.</p>
            <Button onClick={handleSaveContact} disabled={saving === 'contact'}>
              {saving === 'contact' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Info
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="info@yourcompany.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea id="address" value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} placeholder="Your full business address" rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
