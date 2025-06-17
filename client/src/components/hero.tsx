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
    <section id="home" className="relative min-h-screen bg-gradient-to-br from-soft-cream via-white to-light-blue overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-shape absolute top-1/4 left-1/4 w-32 h-32 bg-warm-orange/20 rounded-full blur-3xl"></div>
        <div className="floating-shape-delay absolute top-1/3 right-1/3 w-48 h-48 bg-golden-yellow/20 rounded-full blur-3xl"></div>
        <div className="floating-shape absolute bottom-1/4 left-1/2 w-40 h-40 bg-deep-navy/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Geometric Shapes */}
      <div className="absolute top-20 right-10 w-16 h-16 border-4 border-warm-orange/30 rotate-45 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-12 h-12 bg-golden-yellow/40 rounded-full animate-bounce"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-warm-orange to-golden-yellow text-white rounded-full text-sm font-medium shadow-lg">
              <Award className="mr-2 h-4 w-4" />
              Gilbert's Premier Window & Door Specialists
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="text-deep-navy">Transform Your</span>
              <br />
              <span className="bg-gradient-to-r from-warm-orange to-golden-yellow bg-clip-text text-transparent">
                Home's Vision
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 leading-relaxed max-w-lg">
              Elevate your living space with premium Milgard and Pella windows and doors. 
              Where craftsmanship meets innovation in Gilbert, Arizona.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToContact}
                className="group bg-gradient-to-r from-deep-navy to-warm-orange text-white px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg transform hover:scale-105"
              >
                <Calculator className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Get Your Free Estimate
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-deep-navy text-deep-navy px-8 py-4 rounded-2xl hover:bg-deep-navy hover:text-white transition-all duration-300 font-semibold text-lg"
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
                <div className="flex text-golden-yellow">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600 font-medium">5.0 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="text-success-green h-5 w-5" />
                <span className="text-gray-600 font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="text-warm-orange h-5 w-5" />
                <span className="text-gray-600 font-medium">500+ Happy Customers</span>
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
