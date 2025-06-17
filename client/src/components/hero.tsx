import { Button } from "@/components/ui/button";
import { Calculator, Phone, Star, Shield, Award, MapPin, Home, Users, CheckCircle } from "lucide-react";
import logoPath from "@assets/Windows & Doors Near Me LLC (1)_1750122454387.png";

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative bg-white dark:bg-background">
      {/* Top contact bar - professional contractor style */}
      <div className="bg-primary text-primary-foreground py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              (480) 933-4392
            </span>
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Gilbert, AZ & Surrounding Areas
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Award className="h-4 w-4" />
            <span>Licensed & Insured | ROC #123456</span>
          </div>
        </div>
      </div>

      {/* Main hero section */}
      <div className="bg-gradient-to-b from-secondary/20 to-white dark:from-muted/20 dark:to-background py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="mb-6">
                  <img 
                    src={logoPath} 
                    alt="Windows & Doors Near Me LLC Logo" 
                    className="h-16 w-auto mx-auto lg:mx-0"
                  />
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  <span className="block">Professional</span>
                  <span className="block text-primary">Windows & Doors</span>
                  <span className="block">Installation</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Authorized Milgard & Pella dealer serving Gilbert and surrounding areas. 
                  Premium quality installations backed by 15+ years of experience.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={scrollToContact}
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg font-semibold"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Get Free Estimate
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 px-8 py-4 text-lg font-semibold" 
                  asChild
                >
                  <a href="tel:4809334392" className="flex items-center">
                    <Phone className="mr-2 h-5 w-5" />
                    (480) 933-4392
                  </a>
                </Button>
              </div>
              
              {/* Service highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg mb-3">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Licensed & Insured</h3>
                  <p className="text-sm text-muted-foreground">Fully licensed and insured professionals</p>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent text-accent-foreground rounded-lg mb-3">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">15+ Years</h3>
                  <p className="text-sm text-muted-foreground">Experience in window & door installation</p>
                </div>
                
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg mb-3">
                    <Star className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Quality Work</h3>
                  <p className="text-sm text-muted-foreground">Premium installations with warranty</p>
                </div>
              </div>
            </div>
            
            {/* Right content - Professional image placeholder */}
            <div className="relative">
              <div className="bg-card border rounded-2xl p-8 shadow-lg">
                <div className="aspect-[4/3] bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="text-center text-muted-foreground">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Home className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Professional Installation</h3>
                    <p className="text-sm">Quality windows & doors for your home</p>
                  </div>
                </div>
                
                {/* Trust indicators */}
                <div className="mt-6 flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-muted-foreground ml-2">5.0 Rating</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">500+ Projects</span>
                  </div>
                </div>
              </div>
              
              {/* Floating service areas card */}
              <div className="absolute -bottom-6 -right-6 bg-card border rounded-lg p-4 shadow-lg">
                <p className="text-sm font-semibold text-foreground mb-2">Service Areas:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Gilbert</span>
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Mesa</span>
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Chandler</span>
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">Tempe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}