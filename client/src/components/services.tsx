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
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/10"
    },
    {
      icon: <Warehouse className="h-8 w-8" />,
      title: "Window & Door Supply",
      description: "Authorized dealer of premium Milgard and Pella products. We supply high-quality windows and doors for any project size.",
      features: ["Premium brands", "Competitive pricing", "Fast delivery"],
      color: "from-accent to-accent/80",
      bgColor: "bg-accent/10"
    },
    {
      icon: <Home className="h-8 w-8" />,
      title: "Replacement Services",
      description: "Complete window and door replacement services for residential properties. Upgrade your home's energy efficiency and curb appeal.",
      features: ["Energy efficient", "Custom sizing", "Warranty included"],
      color: "from-primary to-accent",
      bgColor: "bg-primary/5"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Repair Services",
      description: "Professional repair services for existing windows and doors. From glass replacement to hardware repairs, we fix it right.",
      features: ["Same-day service", "All brands serviced", "Parts in stock"],
      color: "from-accent to-primary",
      bgColor: "bg-accent/5"
    },
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: "Free Consultations",
      description: "Professional consultation and assessment of your window and door needs. Get expert advice and accurate estimates at no cost.",
      features: ["No obligation", "Expert advice", "Detailed estimates"],
      color: "from-primary to-primary/70",
      bgColor: "bg-primary/5"
    },
    {
      icon: <Medal className="h-8 w-8" />,
      title: "Emergency Services",
      description: "24/7 emergency repair services for urgent window and door issues. We're here when you need us most.",
      features: ["24/7 availability", "Rapid response", "Security focus"],
      color: "from-accent to-accent/70",
      bgColor: "bg-accent/5"
    }
  ];

  return (
    <section id="services" className="py-12 sm:py-20 bg-muted/30 dark:bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 py-2 sm:px-4 bg-primary text-primary-foreground rounded-full text-xs sm:text-sm font-medium shadow-lg mb-4 sm:mb-6">
            <Medal className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comprehensive Window & Door Solutions</span>
            <span className="sm:hidden">Complete W&D Solutions</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
            Services That
            <span className="text-primary"> Transform</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            From consultation to completion, we handle every aspect of your project with unmatched expertise and care.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <Card key={index} className="relative group hover-lift cursor-pointer bg-card border shadow-lg">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Icon with gradient background */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white text-sm sm:text-base">
                    {service.icon}
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-card-foreground mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-card-foreground">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${service.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                        <Check className="text-white h-3 w-3" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 bg-primary rounded-3xl shadow-2xl">
            <div className="text-primary-foreground">
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-primary-foreground/80">Contact us today for your free consultation and estimate.</p>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  const element = document.getElementById('contact');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="secondary"
                className="px-6 py-3 font-semibold"
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
