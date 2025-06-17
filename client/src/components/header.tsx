import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import logoPath from "@assets/Windows & Doors Near Me LLC (1)_1750122454387.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-background dark:bg-background border-b border-border sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center">
            <div className="flex items-center group cursor-pointer" onClick={() => scrollToSection('home')}>
              <div className="relative mr-2 sm:mr-4">
                <img 
                  src={logoPath} 
                  alt="Windows & Doors Near Me LLC Logo" 
                  className="h-12 w-14 sm:h-20 sm:w-24 transition-all duration-300 group-hover:scale-110 dark:filter dark:brightness-0 dark:invert"
                />
              </div>
              <div>
                <div className="text-sm sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  <span className="hidden sm:inline">Windows & Doors Near Me</span>
                  <span className="sm:hidden">W&D Near Me</span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Gilbert, Arizona</div>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              Home
            </button>
            <button onClick={() => scrollToSection('services')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              Services
            </button>
            <button onClick={() => scrollToSection('products')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              Products
            </button>
            <button onClick={() => scrollToSection('gallery')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              Gallery
            </button>
            <button onClick={() => scrollToSection('about')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              About
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
              Contact
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-9 h-9 rounded-md"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <div className="hidden lg:flex items-center text-foreground bg-muted px-4 py-2 rounded-full">
              <Phone className="mr-2 h-4 w-4 text-primary" />
              <a href="tel:4809334392" className="font-semibold hover:text-primary transition-colors">(480) 933-4392</a>
            </div>
            <Button 
              onClick={() => scrollToSection('contact')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 font-medium px-6 py-2 rounded-md"
            >
              Free Quote
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-foreground hover:text-primary transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('home')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">Home</button>
              <button onClick={() => scrollToSection('services')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">Services</button>
              <button onClick={() => scrollToSection('products')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">Products</button>
              <button onClick={() => scrollToSection('gallery')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">Gallery</button>
              <button onClick={() => scrollToSection('about')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">About</button>
              <button onClick={() => scrollToSection('contact')} className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-left">Contact</button>
              <div className="flex items-center text-foreground pt-2">
                <Phone className="mr-2 h-4 w-4 text-primary" />
                <a href="tel:4809334392" className="font-semibold">(480) 933-4392</a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
