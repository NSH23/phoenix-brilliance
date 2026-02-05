import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AdminProvider } from "./contexts/AdminContext";
import { SiteConfigProvider } from "./contexts/SiteConfigContext";

// Lazy load all route components for code splitting
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

// Public Collaborations Pages
const Collaborations = lazy(() => import("./pages/Collaborations"));
const CollaborationDetail = lazy(() => import("./pages/CollaborationDetail"));

// Public Services Page
const Services = lazy(() => import("./pages/Services"));

// Admin Pages
const AdminEntry = lazy(() => import("./pages/admin/AdminEntry"));
const LoginRedirect = lazy(() => import("./pages/admin/LoginRedirect"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminAlbums = lazy(() => import("./pages/admin/Albums"));
const AdminGallery = lazy(() => import("./pages/admin/Gallery"));
const AdminServices = lazy(() => import("./pages/admin/Services"));
const AdminCollaborations = lazy(() => import("./pages/admin/Collaborations"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminInquiries = lazy(() => import("./pages/admin/Inquiries"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminWhyUs = lazy(() => import("./pages/admin/WhyUs"));
const AdminBeforeAfter = lazy(() => import("./pages/admin/BeforeAfter"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
import ProtectedRoute from "./components/admin/ProtectedRoute";

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
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:eventType" element={<GalleryEventType />} />
          <Route path="/gallery/:eventType/:albumId" element={<GalleryAlbum />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:eventType" element={<EventDetail />} />
          <Route path="/collaborations" element={<Collaborations />} />
          <Route path="/collaborations/:partnerId" element={<CollaborationDetail />} />
          <Route path="/services" element={<Services />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginRedirect />} />
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
            path="/admin/events" 
            element={
              <ProtectedRoute>
                <AdminEvents />
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
            path="/admin/services" 
            element={
              <ProtectedRoute>
                <AdminServices />
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
            path="/admin/inquiries" 
            element={
              <ProtectedRoute>
                <AdminInquiries />
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
            path="/admin/why-us" 
            element={
              <ProtectedRoute>
                <AdminWhyUs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/before-after" 
            element={
              <ProtectedRoute>
                <AdminBeforeAfter />
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
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </SiteConfigProvider>
      </AdminProvider>
    </TooltipProvider>
  </HelmetProvider>
);

export default App;
