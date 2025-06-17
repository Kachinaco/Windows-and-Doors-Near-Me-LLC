import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Star, Award, Shield, Check, Calculator } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function MesaWindowsDoors() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const services = [
    "Window Installation",
    "Door Installation", 
    "Window Replacement",
    "Door Replacement",
    "Emergency Repairs",
    "Energy Efficiency Upgrades"
  ];

  const neighborhoods = [
    "Las Sendas",
    "Red Mountain Ranch", 
    "Eastmark",
    "Mountain Bridge",
    "Superstition Springs",
    "Dobson Ranch",
    "Leisure World",
    "Mesa Del Sol"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg mb-6">
              <MapPin className="mr-2 h-4 w-4" />
              Serving Mesa, Arizona
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Mesa Window & Door
              <span className="text-primary block">Installation Specialists</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Expert window and door installation services in Mesa, AZ. Trusted by homeowners 
              from Las Sendas to Eastmark with premium Milgard and Pella products.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={scrollToContact}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Get Free Mesa Estimate
              </Button>
              <Button 
                variant="outline"
                size="lg"
                asChild
              >
                <a href="tel:4809334392" className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  (480) 933-4392
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us for Mesa */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Mesa Residents Trust Us
            </h2>
            <p className="text-xl text-muted-foreground">
              Local expertise serving Mesa communities with professional window and door solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Award className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Mesa Area Experts</h3>
                <p className="text-muted-foreground">Serving Mesa neighborhoods for over 15 years, from Red Mountain Ranch to Dobson Ranch.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Shield className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Licensed & Bonded</h3>
                <p className="text-muted-foreground">Fully licensed contractor with comprehensive insurance for all Mesa installations.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Star className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Mesa 5-Star Service</h3>
                <p className="text-muted-foreground">Consistently top-rated by Mesa homeowners for quality workmanship and reliability.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services in Mesa */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Professional Window & Door Services in Mesa
              </h2>
              <p className="text-muted-foreground mb-6">
                From Eastmark's modern homes to established neighborhoods like Dobson Ranch, 
                we provide expert window and door installation throughout Mesa. Our team 
                understands Mesa's climate and building requirements.
              </p>
              
              <ul className="space-y-3 mb-8">
                {services.map((service, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="text-primary h-5 w-5 mr-3" />
                    <span className="font-medium">{service} in Mesa</span>
                  </li>
                ))}
              </ul>
              
              <Button onClick={scrollToContact} className="bg-primary text-primary-foreground">
                Schedule Mesa Service
              </Button>
            </div>
            
            <div>
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Mesa door installation"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mesa Neighborhoods */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Mesa Communities We Serve
            </h2>
            <p className="text-xl text-muted-foreground">
              Quality window and door installation across all Mesa neighborhoods
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {neighborhoods.map((neighborhood, index) => (
              <Card key={index} className="bg-card border hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <MapPin className="text-primary text-xl mb-2 mx-auto" />
                  <div className="font-medium text-sm">{neighborhood}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready for Your Mesa Window & Door Project?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get your free estimate for professional window and door installation in Mesa, Arizona.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-primary text-primary-foreground" asChild>
              <Link href="/#contact">
                <Calculator className="mr-2 h-5 w-5" />
                Request Your Free Estimate
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:4809334392" className="flex items-center">
                <Phone className="mr-2 h-5 w-5" />
                Call (480) 933-4392
              </a>
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Serving Mesa from our Gilbert location: 751 N Monterey St Suite 123</p>
            <p>Licensed, Bonded & Insured | ROC #123456</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}