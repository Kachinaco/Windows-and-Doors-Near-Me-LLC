import { Card, CardContent } from "@/components/ui/card";
import { IdCard, Shield } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Windows & Doors Near Me LLC</h2>
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Serving Gilbert, Arizona and surrounding communities for over 15 years, we've built our reputation 
              on quality craftsmanship, reliable service, and customer satisfaction.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              As an authorized dealer of Milgard and Pella products, we offer the finest windows and doors 
              available, backed by comprehensive warranties and expert installation. Our team of certified 
              professionals takes pride in every project, ensuring your home receives the quality it deserves.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">15+</div>
                <div className="text-gray-600">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">500+</div>
                <div className="text-gray-600">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">100%</div>
                <div className="text-gray-600">Licensed & Insured</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-blue mb-2">5.0</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Card className="bg-light-blue border-0">
                <CardContent className="flex items-center p-4">
                  <IdCard className="text-primary-blue text-2xl mr-3" />
                  <span className="font-semibold">Licensed Contractors</span>
                </CardContent>
              </Card>
              <Card className="bg-light-blue border-0">
                <CardContent className="flex items-center p-4">
                  <Shield className="text-success-green text-2xl mr-3" />
                  <span className="font-semibold">Fully Insured</span>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Professional installation team at work" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
