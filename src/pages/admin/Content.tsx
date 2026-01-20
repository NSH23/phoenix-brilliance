import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, FileText, Link as LinkIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { mockSiteContent, SiteContent } from '@/data/mockData';
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

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent[]>(mockSiteContent);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: 'https://facebook.com/phoenixevents',
    instagram: 'https://instagram.com/phoenixevents',
    youtube: 'https://youtube.com/@phoenixevents',
    whatsapp: '+919876543210',
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'info@phoenixevents.com',
    phone: '+91 98765 43210',
    address: 'Phoenix Events, 123 Event Street, Mumbai, Maharashtra 400001',
  });

  const handleContentChange = (sectionKey: string, field: keyof SiteContent, value: string) => {
    setContent(content.map(c => 
      c.sectionKey === sectionKey ? { ...c, [field]: value } : c
    ));
  };

  const handleSaveContent = () => {
    // In real implementation, this would call your API
    toast.success('Site content saved successfully');
  };

  const handleSaveSocial = () => {
    toast.success('Social links saved successfully');
  };

  const handleSaveContact = () => {
    toast.success('Contact information saved successfully');
  };

  const handleResetContent = () => {
    setContent(mockSiteContent);
    toast.info('Content reset to defaults');
  };

  return (
    <AdminLayout title="Site Content" subtitle="Manage your website text and information">
      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sections" className="gap-2">
            <FileText className="w-4 h-4" />
            Page Sections
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            Contact Info
          </TabsTrigger>
        </TabsList>

        {/* Page Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Edit the text content for different sections of your website.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetContent}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSaveContent}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {content.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{section.sectionKey} Section</CardTitle>
                    <CardDescription>
                      Edit the content for the {section.sectionKey} section of your website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`${section.sectionKey}-title`}>Title</Label>
                      <Input
                        id={`${section.sectionKey}-title`}
                        value={section.title}
                        onChange={(e) => handleContentChange(section.sectionKey, 'title', e.target.value)}
                        placeholder="Section title"
                      />
                    </div>

                    {section.subtitle !== undefined && (
                      <div className="grid gap-2">
                        <Label htmlFor={`${section.sectionKey}-subtitle`}>Subtitle</Label>
                        <Input
                          id={`${section.sectionKey}-subtitle`}
                          value={section.subtitle || ''}
                          onChange={(e) => handleContentChange(section.sectionKey, 'subtitle', e.target.value)}
                          placeholder="Section subtitle"
                        />
                      </div>
                    )}

                    {section.description !== undefined && (
                      <div className="grid gap-2">
                        <Label htmlFor={`${section.sectionKey}-description`}>Description</Label>
                        <Textarea
                          id={`${section.sectionKey}-description`}
                          value={section.description || ''}
                          onChange={(e) => handleContentChange(section.sectionKey, 'description', e.target.value)}
                          placeholder="Section description"
                          rows={3}
                        />
                      </div>
                    )}

                    {section.ctaText !== undefined && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`${section.sectionKey}-cta-text`}>CTA Text</Label>
                          <Input
                            id={`${section.sectionKey}-cta-text`}
                            value={section.ctaText || ''}
                            onChange={(e) => handleContentChange(section.sectionKey, 'ctaText', e.target.value)}
                            placeholder="Button text"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`${section.sectionKey}-cta-link`}>CTA Link</Label>
                          <Input
                            id={`${section.sectionKey}-cta-link`}
                            value={section.ctaLink || ''}
                            onChange={(e) => handleContentChange(section.sectionKey, 'ctaLink', e.target.value)}
                            placeholder="/contact"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage your social media links displayed on the website.
            </p>
            <Button onClick={handleSaveSocial}>
              <Save className="w-4 h-4 mr-2" />
              Save Links
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={socialLinks.whatsapp}
                  onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                  placeholder="+919876543210"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code without + symbol for WhatsApp link
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Update your business contact information.
            </p>
            <Button onClick={handleSaveContact}>
              <Save className="w-4 h-4 mr-2" />
              Save Info
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="info@yourcompany.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  placeholder="Your full business address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
