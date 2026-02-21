import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { logger } from "@/utils/logger";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.warn("404 Error: User attempted to access non-existent route", { pathname: location.pathname });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Page Not Found | Phoenix Events & Production</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <h1 className="mb-2 text-6xl sm:text-7xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-lg text-muted-foreground">Page not found. The link may be broken or the page may have been moved.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
