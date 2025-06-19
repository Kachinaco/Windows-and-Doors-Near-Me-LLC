import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

// Milgard product categories data
const productCategories = [
  {
    id: 1,
    name: "Milgard Tuscany® Series V400",
    description: "Classic vinyl windows with traditional styling and exceptional performance",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    features: ["Energy efficient", "Low maintenance", "Multiple color options"]
  },
  {
    id: 2,
    name: "Milgard Trinsic® Series V300",
    description: "Modern vinyl windows with clean lines and contemporary appeal",
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
    features: ["Contemporary design", "Superior insulation", "Easy operation"]
  },
  {
    id: 3,
    name: "Milgard Style Line® Series V250",
    description: "Versatile vinyl windows that complement any architectural style",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop",
    features: ["Architectural flexibility", "Durable construction", "Weather resistant"]
  },
  {
    id: 4,
    name: "Milgard Ultra™ Series C650",
    description: "Premium fiberglass windows with wood-like appearance and strength",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
    features: ["Fiberglass strength", "Wood grain texture", "Exceptional durability"]
  },
  {
    id: 5,
    name: "Thermally Improved Aluminum A250",
    description: "Commercial-grade aluminum windows for modern applications",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop",
    features: ["Thermal break technology", "Commercial strength", "Sleek profiles"]
  }
];

export default function CatalogPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
              FEATURED WINDOWS
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Milgard Windows and Doors
          </h1>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              As a Certified Milgard Dealer, our windows come direct from the factory to you.
              They are manufactured exactly the same as the Milgard windows that you would 
              buy from any local dealer and carry the exact same{" "}
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Milgard Warranty Information
              </span>.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Milgard Windows are available in Arizona, California, Nevada, Oregon and Washington.
            </p>
          </div>
        </div>
      </div>

      {/* Product Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {productCategories.map((category) => (
            <Card key={category.id} className="group overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Click to start pricing now!
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 text-center">
                  {category.name}
                </h3>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2"
                  onClick={() => {
                    // Store selected product in sessionStorage and navigate to quote page
                    sessionStorage.setItem('selectedProduct', category.name);
                    setLocation('/quote');
                  }}
                >
                  Start Pricing Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {(() => {
            const category = productCategories.find(c => c.id === selectedCategory);
            if (!category) return null;
            
            return (
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                          {category.name}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                          {category.description}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          Key Features:
                        </h3>
                        <ul className="space-y-2">
                          {category.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                              <ArrowRight className="h-4 w-4 text-orange-600 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <Button 
                          size="lg" 
                          className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                        >
                          Get Free Quote
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Schedule Consultation
                        </Button>
                      </div>
                    </div>
                    
                    <div className="lg:pl-8">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-96 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Need help choosing? Contact our Milgard specialists at{" "}
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          (480) 993-4392
                        </span>
                      </p>
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedCategory(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Close Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Bottom CTA Section */}
      <div className="bg-blue-900 dark:bg-blue-950 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Home with Milgard Windows?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get a free consultation and quote from Gilbert's trusted window installation experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
            >
              Get Free Quote Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3"
            >
              Call (480) 993-4392
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}