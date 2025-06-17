import { Button } from "@/components/ui/button";
import { Calculator, Phone, Star, Shield, Zap, Award, Users } from "lucide-react";

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen bg-background dark:bg-background">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30 dark:opacity-20">
        <div className="subtle-animation absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="subtle-animation-delay absolute top-1/3 right-1/3 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg">
              <Award className="mr-2 h-4 w-4" />
              Gilbert's Premier Window & Door Specialists
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Transform Your</span>
              <br />
              <span className="text-primary">
                Home's Vision
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Elevate your living space with premium Milgard and Pella windows and doors. 
              Where craftsmanship meets innovation in Gilbert, Arizona.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToContact}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-semibold"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Get Your Free Estimate
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
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-muted-foreground font-medium">5.0 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="text-green-600 h-4 w-4" />
                <span className="text-muted-foreground font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="text-primary h-4 w-4" />
                <span className="text-muted-foreground font-medium">500+ Happy Customers</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Main Image */}
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Modern home with beautiful windows" 
                className="rounded-3xl shadow-2xl w-full h-auto transform rotate-2 hover:rotate-0 transition-transform duration-500"
              />
              
              {/* Floating Stats Cards */}
              <div className="absolute -bottom-8 -left-8 glass-card p-6 rounded-2xl shadow-xl hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-warm-orange to-golden-yellow rounded-full flex items-center justify-center">
                    <Zap className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-deep-navy">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-8 -right-8 glass-card p-6 rounded-2xl shadow-xl hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-success-green to-primary-blue rounded-full flex items-center justify-center">
                    <Award className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-deep-navy">A+</div>
                    <div className="text-sm text-gray-600">BBB Rating</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-1/2 -right-16 w-32 h-32 bg-gradient-to-r from-warm-orange to-golden-yellow rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-16 left-1/2 w-24 h-24 bg-gradient-to-r from-deep-navy to-primary-blue rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
