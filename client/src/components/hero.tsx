import { Button } from "@/components/ui/button";
import { Calculator, Phone, Star, Shield } from "lucide-react";

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-light-blue to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Professional <span className="text-primary-blue">Windows & Doors</span> in Gilbert, AZ
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Trusted supplier and installer of premium Milgard and Pella windows and doors. 
              Serving Gilbert and surrounding areas with expert craftsmanship and reliable service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                onClick={scrollToContact}
                className="bg-primary-blue text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Get Free Estimate
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-primary-blue text-primary-blue px-8 py-4 rounded-lg hover:bg-primary-blue hover:text-white transition-colors duration-200 font-semibold text-lg"
                asChild
              >
                <a href="tel:4809334392">
                  <Phone className="mr-2 h-5 w-5" />
                  Call (480) 933-4392
                </a>
              </Button>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600">5.0 (127 Reviews)</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="text-success-green mr-2 h-5 w-5" />
                <span>Licensed & Insured</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Modern home with beautiful windows" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
              <div className="text-2xl font-bold text-primary-blue">15+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="absolute -top-6 -right-6 bg-success-green text-white p-6 rounded-xl shadow-lg">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-white">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
