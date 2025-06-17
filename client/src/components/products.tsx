import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Shield, Settings, Award, Check, BookOpen, Star, Zap } from "lucide-react";

export default function Products() {
  return (
    <section id="products" className="py-20 bg-gradient-to-br from-white via-soft-cream to-light-blue relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-warm-orange/20 to-golden-yellow/20 rounded-full blur-3xl floating-shape"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-r from-deep-navy/20 to-primary-blue/20 rounded-full blur-3xl floating-shape-delay"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-warm-orange to-golden-yellow text-white rounded-full text-sm font-medium shadow-lg mb-6">
            <Award className="mr-2 h-4 w-4" />
            Authorized Premium Dealer
          </div>
          <h2 className="text-5xl font-bold text-deep-navy mb-6">
            Trusted
            <span className="bg-gradient-to-r from-warm-orange to-golden-yellow bg-clip-text text-transparent"> Brands</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We partner with industry leaders to bring you the finest windows and doors, 
            backed by comprehensive warranties and our expert installation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Milgard Section */}
          <Card className="group relative overflow-hidden border-0 shadow-2xl hover-lift bg-gradient-to-br from-white to-soft-cream">
            <CardContent className="p-0">
              {/* Header */}
              <div className="relative p-8 bg-gradient-to-r from-deep-navy to-primary-blue text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">MILGARD</div>
                    <div className="flex items-center space-x-1 text-golden-yellow">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-blue-100 text-lg">Premium vinyl, wood, and fiberglass solutions</p>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400" 
                  alt="Milgard windows installation" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-8">
                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-success-green/10 to-primary-blue/10 rounded-2xl">
                    <Leaf className="text-success-green text-2xl mb-2 mx-auto" />
                    <div className="font-semibold text-deep-navy">Energy Star Rated</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-warm-orange/10 to-golden-yellow/10 rounded-2xl">
                    <Shield className="text-warm-orange text-2xl mb-2 mx-auto" />
                    <div className="font-semibold text-deep-navy">Lifetime Warranty</div>
                  </div>
                </div>
                
                {/* Product List */}
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-success-green to-primary-blue flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Tuscany Series Vinyl Windows</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-success-green to-primary-blue flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Ultra Series Fiberglass</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-success-green to-primary-blue flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Essence Series Wood Windows</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-success-green to-primary-blue flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Moving Glass Wall Systems</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Pella Section */}
          <Card className="group relative overflow-hidden border-0 shadow-2xl hover-lift bg-gradient-to-br from-white to-soft-cream">
            <CardContent className="p-0">
              {/* Header */}
              <div className="relative p-8 bg-gradient-to-r from-warm-orange to-golden-yellow text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">PELLA</div>
                    <div className="flex items-center space-x-1 text-white">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-orange-100 text-lg">Innovation meets superior performance</p>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400" 
                  alt="Pella patio doors installation" 
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="p-8">
                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-deep-navy/10 to-primary-blue/10 rounded-2xl">
                    <Zap className="text-deep-navy text-2xl mb-2 mx-auto" />
                    <div className="font-semibold text-deep-navy">Smart Technology</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-success-green/10 to-warm-orange/10 rounded-2xl">
                    <Award className="text-success-green text-2xl mb-2 mx-auto" />
                    <div className="font-semibold text-deep-navy">Award Winning</div>
                  </div>
                </div>
                
                {/* Product List */}
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-warm-orange to-golden-yellow flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Impervia Fiberglass Windows</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-warm-orange to-golden-yellow flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">250 Series Vinyl Windows</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-warm-orange to-golden-yellow flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Architect Series Wood Windows</span>
                  </li>
                  <li className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-warm-orange to-golden-yellow flex items-center justify-center mr-3">
                      <Check className="text-white h-3 w-3" />
                    </div>
                    <span className="font-medium">Sliding Patio Doors</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center gap-6 p-8 bg-gradient-to-r from-deep-navy via-primary-blue to-warm-orange rounded-3xl shadow-2xl">
            <div className="text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Explore Our Product Catalog</h3>
              <p className="text-blue-100">Discover the perfect windows and doors for your home</p>
            </div>
            <Button className="bg-white text-deep-navy hover:bg-gray-100 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              View Product Catalog
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
