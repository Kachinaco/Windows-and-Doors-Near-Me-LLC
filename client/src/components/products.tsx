import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Shield, Settings, Award, Check, BookImage } from "lucide-react";

export default function Products() {
  return (
    <section id="products" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Premium Brands We Carry</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Authorized dealer of industry-leading Milgard and Pella windows and doors. 
            Quality products backed by comprehensive warranties.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Milgard Section */}
          <Card className="bg-gradient-to-br from-light-blue to-white shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-primary-blue mb-4">MILGARD</div>
                <p className="text-gray-600 text-lg">Premium vinyl, wood, and fiberglass windows and doors</p>
              </div>
              
              <img 
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400" 
                alt="Milgard windows installation" 
                className="rounded-xl shadow-lg w-full h-64 object-cover mb-6"
              />
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <Leaf className="text-success-green text-2xl mb-2 mx-auto" />
                  <div className="font-semibold">Energy Efficient</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <Shield className="text-primary-blue text-2xl mb-2 mx-auto" />
                  <div className="font-semibold">Lifetime Warranty</div>
                </div>
              </div>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Tuscany Series Vinyl Windows
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Ultra Series Fiberglass
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Essence Series Wood Windows
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Moving Glass Wall Systems
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Pella Section */}
          <Card className="bg-gradient-to-br from-light-blue to-white shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-primary-blue mb-4">PELLA</div>
                <p className="text-gray-600 text-lg">Innovative design meets superior performance</p>
              </div>
              
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400" 
                alt="Pella patio doors installation" 
                className="rounded-xl shadow-lg w-full h-64 object-cover mb-6"
              />
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <Settings className="text-primary-blue text-2xl mb-2 mx-auto" />
                  <div className="font-semibold">Smart Technology</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow">
                  <Award className="text-success-green text-2xl mb-2 mx-auto" />
                  <div className="font-semibold">Award Winning</div>
                </div>
              </div>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Impervia Fiberglass Windows
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  250 Series Vinyl Windows
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Architect Series Wood Windows
                </li>
                <li className="flex items-center">
                  <Check className="text-success-green mr-3 h-4 w-4" />
                  Sliding Patio Doors
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-12">
          <Button className="bg-primary-blue text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg">
            <BookImage className="mr-2 h-5 w-5" />
            View Product BookImage
          </Button>
        </div>
      </div>
    </section>
  );
}
