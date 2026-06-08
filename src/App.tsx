import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { VENUES_LIST_PATH, venueDetailPath } from "@/lib/venueRoutes";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminProvider } from "./contexts/AdminContext";
import { SiteConfigProvider } from "./contexts/SiteConfigContext";
import { LeadCaptureProvider } from "./contexts/LeadCaptureContext";
import GlobalBackground from "@/components/GlobalBackground";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminThemeSync from "./components/admin/AdminThemeSync";
import AdminPwaManager from "./components/admin/AdminPwaManager";
import PublicSiteLayout from "./components/PublicSiteLayout";

// Lazy load all route components for code splitting
/** Preserve ?open= and other query params when redirecting legacy /admin/inquiries links (e.g. push notifications). */
function RedirectInquiriesToNotifications() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", "inquiries");
  return <Navigate to={`/admin/notifications?${params.toString()}`} replace />;
}

function RedirectLegacyVenueDetail() {
  const { partnerId } = useParams();
  if (!partnerId) return <Navigate to={VENUES_LIST_PATH} replace />;
  return <Navigate to={venueDetailPath(partnerId)} replace />;
}

const Index = lazy(() => import("./pages/Index"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Public Gallery Pages
const Gallery = lazy(() => import("./pages/Gallery"));
const GalleryEventType = lazy(() => import("./pages/GalleryEventType"));
const GalleryAlbum = lazy(() => import("./pages/GalleryAlbum"));

// Public Events Pages
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));

// Public Venues Pages (legacy /collaborations redirects here)
const Venues = lazy(() => import("./pages/Venues"));
const Collaborations = lazy(() => import("./pages/Collaborations"));
const CollaborationDetail = lazy(() => import("./pages/CollaborationDetail"));

// Public Services Page
const Services = lazy(() => import("./pages/Services"));

// Admin Pages
const AdminEntry = lazy(() => import("./pages/admin/AdminEntry"));
const LoginRedirect = lazy(() => import("./pages/admin/LoginRedirect"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminEventEdit = lazy(() => import("./pages/admin/EventEdit"));
const AdminAlbums = lazy(() => import("./pages/admin/Albums"));
const AdminAlbumEdit = lazy(() => import("./pages/admin/AlbumEdit"));
const AdminGallery = lazy(() => import("./pages/admin/Gallery"));
const AdminServices = lazy(() => import("./pages/admin/Services"));
const AdminServiceEdit = lazy(() => import("./pages/admin/ServiceEdit"));
const AdminCollaborations = lazy(() => import("./pages/admin/Collaborations"));
const AdminVenueEdit = lazy(() => import("./pages/admin/VenueEdit"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminWpLeads = lazy(() => import("./pages/admin/WpLeads"));
const AdminWpAnalytics = lazy(() => import("./pages/admin/WpAnalytics"));
const AdminWpMedia = lazy(() => import("./pages/admin/WpMedia"));
const AdminContent = lazy(() => import("./pages/admin/Content"));


const AdminContentMedia = lazy(() => import("./pages/admin/ContentMedia"));
const AdminMomentVideoEdit = lazy(() => import("./pages/admin/MomentVideoEdit"));
const AdminHeroSlotEdit = lazy(() => import("./pages/admin/HeroSlotEdit"));
const AdminBackgroundImages = lazy(() => import("./pages/admin/BackgroundImages"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
const AdminSetPassword = lazy(() => import("./pages/admin/SetPassword"));
const AdminWhyUs = lazy(() => import("./pages/admin/WhyUs"));
const AdminWpDashboard = lazy(() => import("./pages/admin/WpDashboard"));
const AdminWpSettings = lazy(() => import("./pages/admin/WpSettings"));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes — image protection + optimized delivery */}
          <Route element={<PublicSiteLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:eventType" element={<GalleryEventType />} />
            <Route path="/gallery/:eventType/:albumId" element={<GalleryAlbum />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventType" element={<EventDetail />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:partnerId" element={<CollaborationDetail />} />
            <Route path="/collaborations" element={<Collaborations />} />
            <Route path="/collaborations/:partnerId" element={<RedirectLegacyVenueDetail />} />
            <Route path="/services" element={<Services />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginRedirect />} />
          <Route path="/admin/set-password" element={<AdminSetPassword />} />
          <Route path="/admin" element={<AdminEntry />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wp-dashboard"
            element={
              <ProtectedRoute>
                <AdminWpDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wp-settings"
            element={
              <ProtectedRoute>
                <AdminWpSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wp-alerts"
            element={
              <ProtectedRoute>
                <Navigate to="/admin/notifications?tab=wp" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <ProtectedRoute>
                <AdminEventEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/albums/:id/edit"
            element={
              <ProtectedRoute>
                <AdminAlbumEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/albums"
            element={
              <ProtectedRoute>
                <AdminAlbums />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <ProtectedRoute>
                <AdminGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services/:id/edit"
            element={
              <ProtectedRoute>
                <AdminServiceEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute>
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/why-us"
            element={
              <ProtectedRoute>
                <AdminWhyUs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collaborations/:id/edit"
            element={
              <ProtectedRoute>
                <AdminVenueEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collaborations"
            element={
              <ProtectedRoute>
                <AdminCollaborations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/testimonials"
            element={
              <ProtectedRoute>
                <AdminTestimonials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute>
                <AdminContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wp-leads"
            element={
              <ProtectedRoute>
                <AdminWpLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/wp-analytics"
            element={
              <ProtectedRoute>
                <AdminWpAnalytics />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/inquiries" element={<RedirectInquiriesToNotifications />} />
          <Route path="/admin/wp-notifications" element={<Navigate to="/admin/notifications?tab=wp" replace />} />
          <Route
            path="/admin/wp-media"
            element={
              <ProtectedRoute>
                <AdminWpMedia />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/media/hero/:slot/edit"
            element={
              <ProtectedRoute>
                <AdminHeroSlotEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media/moments/:id/edit"
            element={
              <ProtectedRoute>
                <AdminMomentVideoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <AdminContentMedia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/background-images"
            element={
              <ProtectedRoute>
                <AdminBackgroundImages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/team"
            element={
              <ProtectedRoute>
                <AdminTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}



const App = () => (
  <HelmetProvider>
    <TooltipProvider>
      <AdminProvider>
        <SiteConfigProvider>
          <Sonner />
          <BrowserRouter>
            <LeadCaptureProvider>
              <AdminThemeSync />
              <AdminPwaManager />
              <ScrollToTop />
              <GlobalBackground />
              <div className="global-grain-overlay" aria-hidden />
              <LeadCaptureModal />
              <AppRoutes />
            </LeadCaptureProvider>
          </BrowserRouter>
        </SiteConfigProvider>
      </AdminProvider>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;
