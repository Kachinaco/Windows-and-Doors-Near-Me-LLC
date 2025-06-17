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
