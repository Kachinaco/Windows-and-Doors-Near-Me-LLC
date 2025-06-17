import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Warehouse, 
  Home, 
  Settings, 
  ClipboardCheck, 
  Medal,
  Check
} from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Professional Installation",
      description: "Expert installation of windows and doors with precision and attention to detail. Our certified technicians ensure perfect fit and finish.",
      features: ["Certified installers", "Quality guarantee", "Clean-up included"],
      color: "from-warm-orange to-golden-yellow",
      bgColor: "bg-warm-orange/10"
    },
    {
      icon: <Warehouse className="h-8 w-8" />,
      title: "Window & Door Supply",
      description: "Authorized dealer of premium Milgard and Pella products. We supply high-quality windows and doors for any project size.",
      features: ["Premium brands", "Competitive pricing", "Fast delivery"],
      color: "from-deep-navy to-primary-blue",
      bgColor: "bg-deep-navy/10"
    },
    {
      icon: <Home className="h-8 w-8" />,
      title: "Replacement Services",
      description: "Complete window and door replacement services for residential properties. Upgrade your home's energy efficiency and curb appeal.",
      features: ["Energy efficient", "Custom sizing", "Warranty included"],
      color: "from-success-green to-primary-blue",
      bgColor: "bg-success-green/10"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Repair Services",
      description: "Professional repair services for existing windows and doors. From glass replacement to hardware repairs, we fix it right.",
      features: ["Same-day service", "All brands serviced", "Parts in stock"],
      color: "from-golden-yellow to-warm-orange",
      bgColor: "bg-golden-yellow/10"
    },
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: "Free Consultations",
      description: "Professional consultation and assessment of your window and door needs. Get expert advice and accurate estimates at no cost.",
      features: ["No obligation", "Expert advice", "Detailed estimates"],
      color: "from-primary-blue to-deep-navy",
      bgColor: "bg-primary-blue/10"
    },
    {
      icon: <Medal className="h-8 w-8" />,
      title: "Emergency Services",
      description: "24/7 emergency repair services for urgent window and door issues. We're here when you need us most.",
      features: ["24/7 availability", "Rapid response", "Security focus"],
      color: "from-warm-orange to-success-green",
      bgColor: "bg-warm-orange/10"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-br from-soft-cream to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-warm-orange/10 to-golden-yellow/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-deep-navy/10 to-primary-blue/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-deep-navy to-warm-orange text-white rounded-full text-sm font-medium shadow-lg mb-6">
            <Medal className="mr-2 h-4 w-4" />
            Comprehensive Window & Door Solutions
          </div>
          <h2 className="text-5xl font-bold text-deep-navy mb-6">
            Services That
            <span className="bg-gradient-to-r from-warm-orange to-golden-yellow bg-clip-text text-transparent"> Transform</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From consultation to completion, we handle every aspect of your project with unmatched expertise and care.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className={`relative group hover-lift cursor-pointer border-0 shadow-lg overflow-hidden ${service.bgColor}`}>
              <CardContent className="p-8 relative z-10">
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {service.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-deep-navy mb-4 group-hover:text-warm-orange transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                        <Check className="text-white h-3 w-3" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              {/* Hover effect overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            </Card>
          ))}
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 bg-gradient-to-r from-deep-navy to-warm-orange rounded-3xl shadow-2xl">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-blue-100">Contact us today for your free consultation and estimate.</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white text-deep-navy hover:bg-gray-100 px-6 py-3 rounded-full font-semibold transition-all duration-300"
              >
                Get Free Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
