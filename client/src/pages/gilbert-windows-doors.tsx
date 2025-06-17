import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Star, Award, Shield, Check, Calculator } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function GilbertWindowsDoors() {
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
    "Agritopia",
    "Val Vista Lakes", 
    "Whitewing",
    "Gilbert Ranch",
    "Morrison Ranch",
    "Cooley Station",
    "Heritage District",
    "Vaughn Grove"
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
              Serving Gilbert, Arizona
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Gilbert Window & Door
              <span className="text-primary block">Installation Experts</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Professional window and door installation services in Gilbert, AZ. Local experts serving 
              your neighborhood with premium Milgard and Pella products since 2009.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={scrollToContact}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Get Free Gilbert Estimate
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

      {/* Why Choose Us for Gilbert */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Gilbert Homeowners Choose Us
            </h2>
            <p className="text-xl text-muted-foreground">
              Local expertise, premium products, and unmatched service in Gilbert, Arizona
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Award className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Gilbert Local Experts</h3>
                <p className="text-muted-foreground">Over 15 years serving Gilbert neighborhoods, understanding local building codes and climate needs.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Shield className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">Licensed & Insured</h3>
                <p className="text-muted-foreground">Fully licensed, bonded, and insured for all window and door installations in Gilbert, AZ.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border">
              <CardContent className="p-6 text-center">
                <Star className="text-primary text-3xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">5-Star Reviews</h3>
                <p className="text-muted-foreground">Consistently rated 5 stars by Gilbert homeowners for quality work and professional service.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services in Gilbert */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Complete Window & Door Services in Gilbert
              </h2>
              <p className="text-muted-foreground mb-6">
                From Heritage District to Agritopia, we provide comprehensive window and door 
                solutions throughout Gilbert. Our local team understands the unique needs of 
                Arizona homes and delivers exceptional results.
              </p>
              
              <ul className="space-y-3 mb-8">
                {services.map((service, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="text-primary h-5 w-5 mr-3" />
                    <span className="font-medium">{service} in Gilbert</span>
                  </li>
                ))}
              </ul>
              
              <Button onClick={scrollToContact} className="bg-primary text-primary-foreground">
                Schedule Gilbert Service
              </Button>
            </div>
            
            <div>
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Gilbert window installation"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gilbert Neighborhoods */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Gilbert Neighborhoods We Serve
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional window and door services throughout Gilbert communities
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
            Ready to Start Your Gilbert Project?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Contact us today for your free estimate on window and door installation in Gilbert, Arizona.
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
            <p>📍 751 N Monterey St Suite 123, Gilbert, AZ 85233</p>
            <p>Licensed, Bonded & Insured | ROC #123456</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}