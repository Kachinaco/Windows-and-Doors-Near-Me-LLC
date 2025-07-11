import { Home, MapPin, Phone, Mail } from "lucide-react";
import { SiFacebook, SiGoogle, SiYelp } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-6">
              <Home className="text-primary text-2xl mr-3" />
              <div className="text-xl font-bold text-secondary-foreground">Windows & Doors Near Me LLC</div>
            </div>
            <p className="text-muted-foreground mb-4">
              Professional window and door installation serving Gilbert, Arizona and surrounding communities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <SiFacebook className="text-xl" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <SiGoogle className="text-xl" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                <SiYelp className="text-xl" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6 text-secondary-foreground">Services</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Window Installation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Door Installation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Window Replacement</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Door Replacement</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Repair Services</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6 text-secondary-foreground">Products</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Milgard Windows</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Pella Windows</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Milgard Doors</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Pella Doors</a></li>
              <li><a href="#" className="hover:text-primary transition-colors duration-200">Custom Solutions</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6 text-secondary-foreground">Contact Info</h3>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start">
                <MapPin className="mt-1 mr-3 text-primary h-4 w-4 flex-shrink-0" />
                <div>751 N Monterey St Suite 123<br />Gilbert, AZ 85233</div>
              </div>
              <div className="flex items-center">
                <Phone className="mr-3 text-primary h-4 w-4" />
                <a href="tel:4809334392" className="hover:text-primary transition-colors">
                  (480) 933-4392
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="mr-3 text-primary h-4 w-4" />
                <div>info@windowsandnearme.com</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Windows & Doors Near Me LLC. All rights reserved. Licensed, Bonded & Insured.</p>
        </div>
      </div>
    </footer>
  );
}
