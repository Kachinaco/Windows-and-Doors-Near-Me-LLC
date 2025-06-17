import { Card, CardContent } from "@/components/ui/card";
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
      icon: <Wrench className="h-12 w-12" />,
      title: "Professional Installation",
      description: "Expert installation of windows and doors with precision and attention to detail. Our certified technicians ensure perfect fit and finish.",
      features: ["Certified installers", "Quality guarantee", "Clean-up included"]
    },
    {
      icon: <Warehouse className="h-12 w-12" />,
      title: "Window & Door Supply",
      description: "Authorized dealer of premium Milgard and Pella products. We supply high-quality windows and doors for any project size.",
      features: ["Premium brands", "Competitive pricing", "Fast delivery"]
    },
    {
      icon: <Home className="h-12 w-12" />,
      title: "Replacement Services",
      description: "Complete window and door replacement services for residential properties. Upgrade your home's energy efficiency and curb appeal.",
      features: ["Energy efficient", "Custom sizing", "Warranty included"]
    },
    {
      icon: <Settings className="h-12 w-12" />,
      title: "Repair Services",
      description: "Professional repair services for existing windows and doors. From glass replacement to hardware repairs, we fix it right.",
      features: ["Same-day service", "All brands serviced", "Parts in stock"]
    },
    {
      icon: <ClipboardCheck className="h-12 w-12" />,
      title: "Free Consultations",
      description: "Professional consultation and assessment of your window and door needs. Get expert advice and accurate estimates at no cost.",
      features: ["No obligation", "Expert advice", "Detailed estimates"]
    },
    {
      icon: <Medal className="h-12 w-12" />,
      title: "Emergency Services",
      description: "24/7 emergency repair services for urgent window and door issues. We're here when you need us most.",
      features: ["24/7 availability", "Rapid response", "Security focus"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete windows and doors solutions from supply to professional installation. 
            We handle every aspect of your project with expertise and care.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="bg-white hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="text-primary-blue mb-6">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="text-gray-600 space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="text-success-green mr-2 h-4 w-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
