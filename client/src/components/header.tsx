import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Sparkles } from "lucide-react";
import logoPath from "@assets/Windows & Doors Near Me LLC (1)_1750122454387.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-deep-navy via-deep-navy to-warm-orange shadow-2xl sticky top-0 z-50 overflow-hidden relative">
      {/* Animated background shapes */}
      <div className="absolute inset-0 opacity-10">
        <div className="floating-shape absolute top-4 right-20 w-16 h-16 bg-golden-yellow rounded-full"></div>
        <div className="floating-shape-delay absolute top-8 right-40 w-8 h-8 bg-warm-orange rounded-full"></div>
        <div className="floating-shape absolute bottom-2 right-60 w-12 h-12 bg-soft-cream rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex items-center group cursor-pointer" onClick={() => scrollToSection('home')}>
              <div className="relative mr-4">
                <img 
                  src={logoPath} 
                  alt="Windows & Doors Near Me LLC Logo" 
                  className="h-12 w-12 filter brightness-0 invert transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-golden-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white text-shadow group-hover:text-golden-yellow transition-colors duration-300">
                  Windows & Doors Near Me
                </div>
                <div className="text-sm text-warm-orange font-medium">Premium Installation • Gilbert, AZ</div>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('services')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('products')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              Products
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('gallery')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              Gallery
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('about')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-golden-yellow transition-all duration-300 group-hover:w-full"></span>
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center text-white bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Phone className="mr-2 h-4 w-4 text-warm-orange" />
              <a href="tel:4809334392" className="font-semibold hover:text-golden-yellow transition-colors">(480) 933-4392</a>
            </div>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-warm-orange to-golden-yellow text-white hover:from-golden-yellow hover:to-warm-orange transition-all duration-300 font-medium px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Free Quote
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-golden-yellow transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('home')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">Home</button>
              <button onClick={() => scrollToSection('services')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">Services</button>
              <button onClick={() => scrollToSection('products')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">Products</button>
              <button onClick={() => scrollToSection('gallery')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">Gallery</button>
              <button onClick={() => scrollToSection('about')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">About</button>
              <button onClick={() => scrollToSection('contact')} className="text-white hover:text-golden-yellow transition-colors duration-200 font-medium text-left">Contact</button>
              <div className="flex items-center text-white pt-2">
                <Phone className="mr-2 h-4 w-4 text-warm-orange" />
                <a href="tel:4809334392" className="font-semibold">(480) 933-4392</a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
