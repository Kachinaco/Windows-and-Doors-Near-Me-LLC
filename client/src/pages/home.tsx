import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Services from "@/components/services";
import Products from "@/components/products";
import Gallery from "@/components/gallery";
import Testimonials from "@/components/testimonials";
import About from "@/components/about";
import ServiceAreas from "@/components/service-areas";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading while checking authentication
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Services />
      <Products />
      <Gallery />
      <Testimonials />
      <About />
      <ServiceAreas />
      <Contact />
      <Footer />
    </div>
  );
}
