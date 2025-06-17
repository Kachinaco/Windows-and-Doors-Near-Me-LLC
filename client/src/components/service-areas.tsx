import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function ServiceAreas() {
  const areas = [
    "Gilbert",
    "Mesa", 
    "Chandler",
    "Tempe",
    "Scottsdale",
    "Queen Creek"
  ];

  return (
    <section className="py-12 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-4">Service Areas</h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            Proudly serving Gilbert and surrounding Arizona communities with professional 
            window and door installation services.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {areas.map((area, index) => (
            <Card key={index} className="bg-card border hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <MapPin className="text-primary text-2xl mb-3 mx-auto" />
                <div className="font-semibold text-card-foreground">{area}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
