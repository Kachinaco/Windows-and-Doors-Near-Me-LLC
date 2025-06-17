import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Phone, Menu, X } from "lucide-react";

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
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary-blue flex items-center">
              <Home className="mr-2" />
              Windows & Doors Near Me LLC
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">Home</button>
            <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">Services</button>
            <button onClick={() => scrollToSection('products')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">Products</button>
            <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">Gallery</button>
            <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">About</button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium">Contact</button>
          </nav>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center text-primary-blue">
              <Phone className="mr-2 h-4 w-4" />
              <a href="tel:4809334392" className="font-semibold">(480) 933-4392</a>
            </div>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-success-green text-white hover:bg-green-600 transition-colors duration-200 font-medium"
            >
              Free Quote
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700 hover:text-primary-blue"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">Home</button>
              <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">Services</button>
              <button onClick={() => scrollToSection('products')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">Products</button>
              <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">Gallery</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">About</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-primary-blue transition-colors duration-200 font-medium text-left">Contact</button>
              <div className="flex items-center text-primary-blue pt-2">
                <Phone className="mr-2 h-4 w-4" />
                <a href="tel:4809334392" className="font-semibold">(480) 933-4392</a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
