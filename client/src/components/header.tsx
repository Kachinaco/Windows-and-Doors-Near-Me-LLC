import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/Windows & Doors Near Me LLC (1)_1750122454387.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-background border-b border-gray-200 dark:border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => scrollToSection('home')}>
            <img 
              src={logoPath} 
              alt="Windows & Doors Near Me LLC Logo" 
              className="h-12 w-auto mr-3"
            />
            <div>
              <div className="text-lg font-bold text-foreground">
                Windows & Doors Near Me
              </div>
              <div className="text-sm text-muted-foreground">
                Gilbert, AZ
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('products')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Products
            </button>
            <button 
              onClick={() => scrollToSection('gallery')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Contact
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:4809334392" className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                (480) 933-4392
              </a>
            </Button>
            <Button onClick={() => scrollToSection('contact')}>
              Free Estimate
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-background border-t border-gray-200 dark:border-border">
          <div className="px-4 py-6 space-y-4">
            <button 
              onClick={() => scrollToSection('home')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('products')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Products
            </button>
            <button 
              onClick={() => scrollToSection('gallery')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium py-2"
            >
              Contact
            </button>
            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:4809334392" className="flex items-center justify-center">
                  <Phone className="mr-2 h-4 w-4" />
                  (480) 933-4392
                </a>
              </Button>
              <Button onClick={() => scrollToSection('contact')} className="w-full">
                Free Estimate
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}